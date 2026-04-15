/**
 * @jest-environment node
 */

jest.mock('@/lib/supabaseAdmin', () => ({ createServiceClient: jest.fn() }));

import { GET, POST } from '@/app/api/votes/route';
import { createServiceClient } from '@/lib/supabaseAdmin';

const VALID_APP_ID = '2026/03/07/flappy-bird';

const SAMPLE_VOTES = [
  { vote_type: 'up', created_at: '2026-04-15T00:00:00Z' },
  { vote_type: 'down', created_at: '2026-04-15T01:00:00Z' },
];

function makeGetRequest(params) {
  const url = new URL('http://localhost/api/votes');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString());
}

function makePostRequest(body) {
  return new Request('http://localhost/api/votes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeSelectClient(result) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };
  chain.eq.mockResolvedValue(result);
  chain.in.mockResolvedValue(result);
  const client = { from: jest.fn().mockReturnValue(chain) };
  createServiceClient.mockReturnValue(client);
  return client;
}

function makeInsertClient(result) {
  const client = {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue(result),
    }),
  };
  createServiceClient.mockReturnValue(client);
  return client;
}

beforeEach(() => {
  makeSelectClient({ data: SAMPLE_VOTES, error: null });
});

afterEach(() => {
  jest.clearAllMocks();
});

// ─── GET ────────────────────────────────────────────────────────────────────

describe('GET /api/votes', () => {
  it('returns 400 when neither appId nor appIds is provided', async () => {
    const res = await GET(new Request('http://localhost/api/votes'));
    expect(res.status).toBe(400);
  });

  it('returns 503 when createServiceClient returns null', async () => {
    createServiceClient.mockReturnValue(null);
    const res = await GET(makeGetRequest({ appId: VALID_APP_ID }));
    expect(res.status).toBe(503);
  });

  it('returns 400 for invalid appId format', async () => {
    const res = await GET(makeGetRequest({ appId: 'bad-id' }));
    expect(res.status).toBe(400);
  });

  it('returns votes for valid single appId', async () => {
    const res = await GET(makeGetRequest({ appId: VALID_APP_ID }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it('returns 500 on DB error for single appId', async () => {
    makeSelectClient({ data: null, error: { message: 'DB error' } });
    const res = await GET(makeGetRequest({ appId: VALID_APP_ID }));
    expect(res.status).toBe(500);
  });

  it('returns votes for bulk appIds', async () => {
    makeSelectClient({ data: SAMPLE_VOTES, error: null });
    const res = await GET(makeGetRequest({ appIds: `${VALID_APP_ID},2026/03/08/snake` }));
    expect(res.status).toBe(200);
  });

  it('returns 400 for invalid appId in bulk list', async () => {
    const res = await GET(makeGetRequest({ appIds: 'bad-id,also-bad' }));
    expect(res.status).toBe(400);
  });

  it('returns 500 on DB error for bulk', async () => {
    makeSelectClient({ data: null, error: { message: 'DB error' } });
    const res = await GET(makeGetRequest({ appIds: VALID_APP_ID }));
    expect(res.status).toBe(500);
  });
});

// ─── POST ───────────────────────────────────────────────────────────────────

describe('POST /api/votes', () => {
  beforeEach(() => {
    makeInsertClient({ error: null });
  });

  it('returns 503 when createServiceClient returns null', async () => {
    createServiceClient.mockReturnValue(null);
    const res = await POST(makePostRequest({ appId: VALID_APP_ID, voteType: 'up' }));
    expect(res.status).toBe(503);
  });

  it('returns 400 for invalid appId format', async () => {
    const res = await POST(makePostRequest({ appId: 'bad-id', voteType: 'up' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing appId', async () => {
    const res = await POST(makePostRequest({ voteType: 'up' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid voteType', async () => {
    const res = await POST(makePostRequest({ appId: VALID_APP_ID, voteType: 'meh' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing voteType', async () => {
    const res = await POST(makePostRequest({ appId: VALID_APP_ID }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new Request('http://localhost/api/votes', {
      method: 'POST',
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 201 for valid up vote', async () => {
    const res = await POST(makePostRequest({ appId: VALID_APP_ID, voteType: 'up' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 201 for valid down vote', async () => {
    const res = await POST(makePostRequest({ appId: VALID_APP_ID, voteType: 'down' }));
    expect(res.status).toBe(201);
  });

  it('returns 500 on DB error', async () => {
    makeInsertClient({ error: { message: 'DB error' } });
    const res = await POST(makePostRequest({ appId: VALID_APP_ID, voteType: 'up' }));
    expect(res.status).toBe(500);
  });
});
