/**
 * @jest-environment node
 */

jest.mock('@/lib/supabaseAdmin', () => ({ createServiceClient: jest.fn() }));

import { GET, POST } from '@/app/api/versus-votes/route';
import { createServiceClient } from '@/lib/supabaseAdmin';

const VALID_VERSUS_ID = 'flappy-bird-showdown';
const VALID_VOTED_APP_ID = '2026/03/07/flappy-bird';

const SAMPLE_VOTES = [
  { voted_app_id: VALID_VOTED_APP_ID, created_at: '2026-04-15T00:00:00Z' },
  { voted_app_id: VALID_VOTED_APP_ID, created_at: '2026-04-15T01:00:00Z' },
];

function makeGetRequest(params) {
  const url = new URL('http://localhost/api/versus-votes');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString());
}

function makePostRequest(body) {
  return new Request('http://localhost/api/versus-votes', {
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

describe('GET /api/versus-votes', () => {
  it('returns 400 when neither versusId nor versusIds is provided', async () => {
    const res = await GET(new Request('http://localhost/api/versus-votes'));
    expect(res.status).toBe(400);
  });

  it('returns 503 when createServiceClient returns null', async () => {
    createServiceClient.mockReturnValue(null);
    const res = await GET(makeGetRequest({ versusId: VALID_VERSUS_ID }));
    expect(res.status).toBe(503);
  });

  it('returns votes for valid single versusId', async () => {
    const res = await GET(makeGetRequest({ versusId: VALID_VERSUS_ID }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
  });

  it('returns 500 on DB error for single versusId', async () => {
    makeSelectClient({ data: null, error: { message: 'DB error' } });
    const res = await GET(makeGetRequest({ versusId: VALID_VERSUS_ID }));
    expect(res.status).toBe(500);
  });

  it('returns votes for bulk versusIds', async () => {
    makeSelectClient({ data: SAMPLE_VOTES, error: null });
    const res = await GET(makeGetRequest({ versusIds: `${VALID_VERSUS_ID},another-match` }));
    expect(res.status).toBe(200);
  });

  it('returns 500 on DB error for bulk', async () => {
    makeSelectClient({ data: null, error: { message: 'DB error' } });
    const res = await GET(makeGetRequest({ versusIds: VALID_VERSUS_ID }));
    expect(res.status).toBe(500);
  });
});

// ─── POST ───────────────────────────────────────────────────────────────────

describe('POST /api/versus-votes', () => {
  beforeEach(() => {
    makeInsertClient({ error: null });
  });

  it('returns 503 when createServiceClient returns null', async () => {
    createServiceClient.mockReturnValue(null);
    const res = await POST(
      makePostRequest({ versusId: VALID_VERSUS_ID, votedAppId: VALID_VOTED_APP_ID })
    );
    expect(res.status).toBe(503);
  });

  it('returns 400 for missing versusId', async () => {
    const res = await POST(makePostRequest({ votedAppId: VALID_VOTED_APP_ID }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty versusId', async () => {
    const res = await POST(makePostRequest({ versusId: '  ', votedAppId: VALID_VOTED_APP_ID }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing votedAppId', async () => {
    const res = await POST(makePostRequest({ versusId: VALID_VERSUS_ID }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty votedAppId', async () => {
    const res = await POST(makePostRequest({ versusId: VALID_VERSUS_ID, votedAppId: '' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid JSON', async () => {
    const req = new Request('http://localhost/api/versus-votes', {
      method: 'POST',
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 201 for valid vote', async () => {
    const res = await POST(
      makePostRequest({ versusId: VALID_VERSUS_ID, votedAppId: VALID_VOTED_APP_ID })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 500 on DB error', async () => {
    makeInsertClient({ error: { message: 'DB error' } });
    const res = await POST(
      makePostRequest({ versusId: VALID_VERSUS_ID, votedAppId: VALID_VOTED_APP_ID })
    );
    expect(res.status).toBe(500);
  });
});
