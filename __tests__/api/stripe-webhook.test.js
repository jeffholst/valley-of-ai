/**
 * @jest-environment node
 */
import { POST } from '@/app/api/stripe/webhook/route';

jest.mock('stripe');
import Stripe from 'stripe';

let mockConstructEvent;

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake';
  process.env.GITHUB_REPO = 'owner/repo';
  process.env.GITHUB_SUGGESTIONS_TOKEN = 'github-token';
  global.fetch = jest.fn();
  mockConstructEvent = jest.fn();
  Stripe.mockImplementation(() => ({
    webhooks: { constructEvent: mockConstructEvent },
  }));
});

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.GITHUB_REPO;
  delete process.env.GITHUB_SUGGESTIONS_TOKEN;
  jest.clearAllMocks();
});

function makeRequest(body = '{}', sig = 'valid-sig') {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': sig, 'Content-Type': 'application/json' },
    body,
  });
}

function makeCheckoutEvent(metadata = { type: 'tip', issueNumber: '42', amount: '10' }) {
  return { type: 'checkout.session.completed', data: { object: { metadata } } };
}

describe('POST /api/stripe/webhook', () => {
  describe('env guard', () => {
    it('returns 503 when STRIPE_SECRET_KEY is missing', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      const res = await POST(makeRequest());
      expect(res.status).toBe(503);
    });

    it('returns 503 when STRIPE_WEBHOOK_SECRET is missing', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      const res = await POST(makeRequest());
      expect(res.status).toBe(503);
    });
  });

  describe('signature verification', () => {
    it('returns 400 when stripe-signature header is missing', async () => {
      const req = new Request('http://localhost/api/stripe/webhook', {
        method: 'POST',
        body: '{}',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Missing signature');
    });

    it('returns 400 when signature is invalid', async () => {
      mockConstructEvent.mockImplementationOnce(() => {
        throw new Error('No signatures found');
      });
      const res = await POST(makeRequest());
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid signature');
    });
  });

  describe('checkout.session.completed', () => {
    it('returns 200 and triggers GitHub updates for a tip with issueNumber', async () => {
      mockConstructEvent.mockReturnValueOnce(makeCheckoutEvent());
      global.fetch.mockResolvedValue(new Response('{}', { status: 200 }));
      const res = await POST(makeRequest());
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.received).toBe(true);
      // Flush fire-and-forget promises
      await new Promise((r) => setTimeout(r, 0));
      // Expects calls to GitHub label + comment endpoints
      expect(global.fetch).toHaveBeenCalledTimes(2);
      const urls = global.fetch.mock.calls.map(([url]) => url);
      expect(urls.some((u) => u.includes('/labels'))).toBe(true);
      expect(urls.some((u) => u.includes('/comments'))).toBe(true);
    });

    it('does not call GitHub for a donation (no issueNumber)', async () => {
      mockConstructEvent.mockReturnValueOnce(makeCheckoutEvent({ type: 'donation', amount: '5' }));
      const res = await POST(makeRequest());
      expect(res.status).toBe(200);
      await new Promise((r) => setTimeout(r, 0));
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('does not call GitHub when issueNumber is not a valid integer', async () => {
      mockConstructEvent.mockReturnValueOnce(
        makeCheckoutEvent({ type: 'tip', issueNumber: 'NaN', amount: '5' })
      );
      const res = await POST(makeRequest());
      expect(res.status).toBe(200);
      await new Promise((r) => setTimeout(r, 0));
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('other event types', () => {
    it('returns 200 and does nothing for unhandled event types', async () => {
      mockConstructEvent.mockReturnValueOnce({
        type: 'payment_intent.created',
        data: { object: {} },
      });
      const res = await POST(makeRequest());
      expect(res.status).toBe(200);
      await new Promise((r) => setTimeout(r, 0));
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});
