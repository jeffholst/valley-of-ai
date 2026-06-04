/**
 * @jest-environment node
 */

jest.mock('@/lib/supabaseAdmin', () => ({ createServiceClient: jest.fn() }));

import { GET } from '@/app/api/multiplayer/status/route';
import { createServiceClient } from '@/lib/supabaseAdmin';

afterEach(() => jest.clearAllMocks());

describe('GET /api/multiplayer/status', () => {
  it('returns configured: false when createServiceClient returns null', async () => {
    createServiceClient.mockReturnValue(null);
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ configured: false });
  });

  it('returns configured: true when createServiceClient returns a client', async () => {
    createServiceClient.mockReturnValue({ from: jest.fn() });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ configured: true });
  });
});
