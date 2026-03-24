/**
 * @jest-environment node
 */
import { GET } from '@/app/api/verify-payment/route';

jest.mock('stripe');
import Stripe from 'stripe';

let mockSessionRetrieve;

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  mockSessionRetrieve = jest.fn();
  Stripe.mockImplementation(() => ({
    checkout: {
      sessions: { retrieve: mockSessionRetrieve },
    },
  }));
});

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  jest.clearAllMocks();
});

function makeRequest(sessionId) {
  const url =
    sessionId !== undefined
      ? `http://localhost/api/verify-payment?session_id=${encodeURIComponent(sessionId)}`
      : 'http://localhost/api/verify-payment';
  return new Request(url);
}

describe('GET /api/verify-payment', () => {
  describe('env guard', () => {
    it('returns 503 when STRIPE_SECRET_KEY is missing', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      const res = await GET(makeRequest('cs_test_abc'));
      expect(res.status).toBe(503);
    });
  });

  describe('input validation', () => {
    it('returns 400 when session_id is missing', async () => {
      const res = await GET(makeRequest(undefined));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Invalid session ID');
    });

    it('returns 400 when session_id does not start with "cs_"', async () => {
      const res = await GET(makeRequest('pi_abc123'));
      expect(res.status).toBe(400);
    });

    it('returns 400 for an empty session_id', async () => {
      const res = await GET(makeRequest(''));
      expect(res.status).toBe(400);
    });
  });

  describe('Stripe session verification', () => {
    it('returns 502 when Stripe throws', async () => {
      mockSessionRetrieve.mockRejectedValueOnce(new Error('No such checkout session'));
      const res = await GET(makeRequest('cs_test_notfound'));
      expect(res.status).toBe(502);
    });

    it('returns { success: true } when payment_status is "paid"', async () => {
      mockSessionRetrieve.mockResolvedValueOnce({ payment_status: 'paid' });
      const res = await GET(makeRequest('cs_test_paid'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
    });

    it('returns { success: false } when payment_status is "unpaid"', async () => {
      mockSessionRetrieve.mockResolvedValueOnce({ payment_status: 'unpaid' });
      const res = await GET(makeRequest('cs_test_unpaid'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('returns { success: false } when payment_status is "no_payment_required"', async () => {
      mockSessionRetrieve.mockResolvedValueOnce({ payment_status: 'no_payment_required' });
      const res = await GET(makeRequest('cs_test_free'));
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(false);
    });

    it('retrieves the session with the provided session_id', async () => {
      mockSessionRetrieve.mockResolvedValueOnce({ payment_status: 'paid' });
      await GET(makeRequest('cs_test_xyz'));
      expect(mockSessionRetrieve).toHaveBeenCalledWith('cs_test_xyz');
    });
  });
});
