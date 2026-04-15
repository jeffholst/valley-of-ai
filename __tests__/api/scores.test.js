/**
 * @jest-environment node
 */

jest.mock('@/data/apps.json', () => [
  { id: '2026/03/07/flappy-bird', name: 'Flappy Bird', maxScore: 999 },
  { id: '2026/03/07/no-max-game', name: 'No Max Game' },
]);

jest.mock('@/lib/supabase', () => ({
  supabase: { from: jest.fn() },
  createServiceClient: jest.fn(),
}));

jest.mock('@/lib/turnstile', () => ({
  verifyTurnstile: jest.fn(),
}));

jest.mock('@/app/api/scores/profanity', () => ({
  isClean: jest.fn(),
}));

import { GET, POST } from '@/app/api/scores/route';
import { supabase, createServiceClient } from '@/lib/supabase';
import { verifyTurnstile } from '@/lib/turnstile';
import { isClean } from '@/app/api/scores/profanity';

const SAMPLE_SCORES = [
  { player_name: 'Alice', score: 420, created_at: '2026-04-15T00:00:00Z' },
  { player_name: 'Bob', score: 380, created_at: '2026-04-15T01:00:00Z' },
];

const VALID_APP_ID = '2026/03/07/flappy-bird';

const VALID_POST_BODY = {
  appId: VALID_APP_ID,
  playerName: 'Alice',
  score: 42,
  turnstileToken: 'test-token',
};

function makeGetRequest(appId) {
  const url = appId
    ? `http://localhost/api/scores?appId=${encodeURIComponent(appId)}`
    : 'http://localhost/api/scores';
  return new Request(url);
}

function makePostRequest(body) {
  return new Request('http://localhost/api/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Returns a chainable anon query mock
function makeAnonChain(result) {
  const chain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(result),
  };
  supabase.from.mockReturnValue(chain);
  return chain;
}

// Returns a service client mock for the POST (insert + select)
function makeServiceClient(insertResult, selectResult) {
  const selectChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue(selectResult),
  };
  const client = {
    from: jest
      .fn()
      .mockReturnValueOnce({ insert: jest.fn().mockResolvedValue(insertResult) })
      .mockReturnValueOnce(selectChain),
  };
  createServiceClient.mockReturnValue(client);
  return client;
}

beforeEach(() => {
  makeAnonChain({ data: SAMPLE_SCORES, error: null });
  makeServiceClient({ error: null }, { data: SAMPLE_SCORES, error: null });
  verifyTurnstile.mockResolvedValue(true);
  isClean.mockReturnValue(true);
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_SECRET_KEY = 'test-service-key';
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_SECRET_KEY;
  jest.clearAllMocks();
});

// ─── GET ────────────────────────────────────────────────────────────────────

describe('GET /api/scores', () => {
  it('returns 400 when appId is missing', async () => {
    const res = await GET(makeGetRequest(null));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid app ID');
  });

  it('returns 400 for appId missing date prefix', async () => {
    const res = await GET(makeGetRequest('flappy-bird'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for appId with path traversal', async () => {
    const res = await GET(makeGetRequest('../../etc/passwd'));
    expect(res.status).toBe(400);
  });

  it('returns scores on success', async () => {
    const res = await GET(makeGetRequest(VALID_APP_ID));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.scores).toHaveLength(2);
    expect(body.scores[0]).toMatchObject({ rank: 1, player_name: 'Alice', score: 420 });
    expect(body.scores[1]).toMatchObject({ rank: 2, player_name: 'Bob', score: 380 });
  });

  it('returns 500 when Supabase returns an error', async () => {
    makeAnonChain({ data: null, error: { message: 'DB error' } });
    const res = await GET(makeGetRequest(VALID_APP_ID));
    expect(res.status).toBe(500);
  });
});

// ─── POST ───────────────────────────────────────────────────────────────────

describe('POST /api/scores', () => {
  describe('env guard', () => {
    it('returns 503 when createServiceClient returns null', async () => {
      createServiceClient.mockReturnValue(null);
      const res = await POST(makePostRequest(VALID_POST_BODY));
      expect(res.status).toBe(503);
    });
  });

  describe('input validation', () => {
    it('returns 400 for invalid JSON body', async () => {
      const req = new Request('http://localhost/api/scores', {
        method: 'POST',
        body: 'not-json',
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it('returns 400 when appId is missing', async () => {
      const { appId: _a, ...body } = VALID_POST_BODY;
      const res = await POST(makePostRequest(body));
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid appId format', async () => {
      const res = await POST(makePostRequest({ ...VALID_POST_BODY, appId: 'bad-id' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for unknown appId not in apps.json', async () => {
      const res = await POST(
        makePostRequest({ ...VALID_POST_BODY, appId: '2026/01/01/unknown-app' })
      );
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('Unknown app');
    });

    it('returns 400 for non-integer score', async () => {
      const res = await POST(makePostRequest({ ...VALID_POST_BODY, score: 3.14 }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for negative score', async () => {
      const res = await POST(makePostRequest({ ...VALID_POST_BODY, score: -1 }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for non-number score', async () => {
      const res = await POST(makePostRequest({ ...VALID_POST_BODY, score: 'high' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when score exceeds maxScore', async () => {
      const res = await POST(makePostRequest({ ...VALID_POST_BODY, score: 1000 })); // maxScore = 999
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toMatch(/maximum/i);
    });

    it('allows score equal to maxScore', async () => {
      const res = await POST(makePostRequest({ ...VALID_POST_BODY, score: 999 }));
      expect(res.status).toBe(201);
    });

    it('allows no maxScore restriction (no-max-game)', async () => {
      const res = await POST(
        makePostRequest({ ...VALID_POST_BODY, appId: '2026/03/07/no-max-game', score: 99999 })
      );
      expect(res.status).toBe(201);
    });

    it('returns 400 for playerName too short', async () => {
      const res = await POST(makePostRequest({ ...VALID_POST_BODY, playerName: 'A' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when trimmed playerName is too short', async () => {
      const res = await POST(makePostRequest({ ...VALID_POST_BODY, playerName: '  A  ' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for whitespace-only playerName', async () => {
      const res = await POST(makePostRequest({ ...VALID_POST_BODY, playerName: '     ' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for playerName too long', async () => {
      const res = await POST(makePostRequest({ ...VALID_POST_BODY, playerName: 'A'.repeat(21) }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for playerName with invalid characters', async () => {
      const res = await POST(makePostRequest({ ...VALID_POST_BODY, playerName: 'Alice<script>' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing playerName', async () => {
      const { playerName: _p, ...body } = VALID_POST_BODY;
      const res = await POST(makePostRequest(body));
      expect(res.status).toBe(400);
    });
  });

  describe('profanity filter', () => {
    it('returns 422 when playerName is flagged as profane', async () => {
      isClean.mockReturnValue(false);
      const res = await POST(makePostRequest(VALID_POST_BODY));
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.error).toMatch(/disallowed/i);
    });
  });

  describe('Turnstile verification', () => {
    it('returns 400 when turnstileToken is missing in non-development env', async () => {
      const { turnstileToken: _t, ...body } = VALID_POST_BODY;
      const res = await POST(makePostRequest(body));
      expect(res.status).toBe(400);
    });

    it('returns 403 when Turnstile verification fails', async () => {
      verifyTurnstile.mockResolvedValue(false);
      const res = await POST(makePostRequest(VALID_POST_BODY));
      expect(res.status).toBe(403);
    });

    it('skips Turnstile check in development env', async () => {
      const original = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      try {
        const { turnstileToken: _t, ...body } = VALID_POST_BODY;
        const res = await POST(makePostRequest(body));
        expect(res.status).toBe(201);
      } finally {
        process.env.NODE_ENV = original;
      }
    });
  });

  describe('success path', () => {
    it('returns 201 with ranked scores on success', async () => {
      const res = await POST(makePostRequest(VALID_POST_BODY));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.scores).toHaveLength(2);
      expect(body.scores[0]).toMatchObject({ rank: 1, player_name: 'Alice' });
    });

    it('trims whitespace from playerName before inserting', async () => {
      const client = makeServiceClient({ error: null }, { data: SAMPLE_SCORES, error: null });
      await POST(makePostRequest({ ...VALID_POST_BODY, playerName: '  Alice  ' }));
      const insertCall = client.from.mock.results[0].value.insert.mock.calls[0][0];
      expect(insertCall.player_name).toBe('Alice');
    });
  });

  describe('database errors', () => {
    it('returns 500 when insert fails', async () => {
      const client = {
        from: jest.fn().mockReturnValue({
          insert: jest.fn().mockResolvedValue({ error: { message: 'DB error' } }),
        }),
      };
      createServiceClient.mockReturnValue(client);
      const res = await POST(makePostRequest(VALID_POST_BODY));
      expect(res.status).toBe(500);
    });

    it('returns 201 with empty scores when post-insert fetch fails', async () => {
      const client = {
        from: jest
          .fn()
          .mockReturnValueOnce({ insert: jest.fn().mockResolvedValue({ error: null }) })
          .mockReturnValueOnce({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
      };
      createServiceClient.mockReturnValue(client);
      const res = await POST(makePostRequest(VALID_POST_BODY));
      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body.scores).toEqual([]);
    });
  });
});
