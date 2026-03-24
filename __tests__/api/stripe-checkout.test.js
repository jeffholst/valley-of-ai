/**
 * @jest-environment node
 */
import { POST } from '@/app/api/stripe/checkout/route';

jest.mock('stripe');
import Stripe from 'stripe';

let mockSessionCreate;

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  mockSessionCreate = jest.fn();
  Stripe.mockImplementation(() => ({
    checkout: {
      sessions: { create: mockSessionCreate },
    },
  }));
});

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  jest.clearAllMocks();
});

function makeRequest(body) {
  return new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/stripe/checkout', () => {
  describe('env guard', () => {
    it('returns 503 when STRIPE_SECRET_KEY is missing', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      const res = await POST(makeRequest({ amount: 5, type: 'tip', issueNumber: 1 }));
      expect(res.status).toBe(503);
    });
  });

  describe('input validation', () => {
    it('returns 400 for invalid JSON body', async () => {
      const req = new Request('http://localhost/api/stripe/checkout', {
        method: 'POST',
        body: 'not-json',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when amount is zero', async () => {
      const res = await POST(makeRequest({ amount: 0, type: 'tip', issueNumber: 1 }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/\$1/);
    });

    it('returns 400 when amount exceeds maximum', async () => {
      const res = await POST(makeRequest({ amount: 1000, type: 'tip', issueNumber: 1 }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when amount is negative', async () => {
      const res = await POST(makeRequest({ amount: -5, type: 'tip', issueNumber: 1 }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid type', async () => {
      const res = await POST(makeRequest({ amount: 5, type: 'refund', issueNumber: 1 }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid type');
    });

    it('returns 400 when tip is missing issueNumber', async () => {
      const res = await POST(makeRequest({ amount: 5, type: 'tip' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('issueNumber');
    });

    it('accepts donation without issueNumber', async () => {
      mockSessionCreate.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/pay/cs_test' });
      const res = await POST(makeRequest({ amount: 5, type: 'donation' }));
      expect(res.status).toBe(200);
    });
  });

  describe('Stripe integration', () => {
    it('returns 502 when Stripe throws', async () => {
      mockSessionCreate.mockRejectedValueOnce(new Error('Stripe error'));
      const res = await POST(makeRequest({ amount: 5, type: 'tip', issueNumber: 1 }));
      expect(res.status).toBe(502);
    });

    it('returns 200 with checkoutUrl on successful tip', async () => {
      const checkoutUrl = 'https://checkout.stripe.com/pay/cs_test_tip';
      mockSessionCreate.mockResolvedValueOnce({ url: checkoutUrl });
      const res = await POST(makeRequest({ amount: 10, type: 'tip', issueNumber: 42 }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.checkoutUrl).toBe(checkoutUrl);
    });

    it('returns 200 with checkoutUrl on successful donation', async () => {
      const checkoutUrl = 'https://checkout.stripe.com/pay/cs_test_donation';
      mockSessionCreate.mockResolvedValueOnce({ url: checkoutUrl });
      const res = await POST(makeRequest({ amount: 25, type: 'donation' }));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.checkoutUrl).toBe(checkoutUrl);
    });

    it('passes amount in cents and correct metadata to Stripe', async () => {
      mockSessionCreate.mockResolvedValueOnce({ url: 'https://checkout.stripe.com/pay/x' });
      await POST(makeRequest({ amount: 7, type: 'tip', issueNumber: 99 }));
      const [sessionArgs] = mockSessionCreate.mock.calls;
      expect(sessionArgs[0].line_items[0].price_data.unit_amount).toBe(700);
      expect(sessionArgs[0].metadata.type).toBe('tip');
      expect(sessionArgs[0].metadata.issueNumber).toBe('99');
    });
  });
});
