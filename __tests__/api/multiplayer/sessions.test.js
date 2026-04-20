/**
 * @jest-environment node
 */

jest.mock('@/lib/supabaseAdmin', () => ({ createServiceClient: jest.fn() }));

import { POST } from '@/app/api/multiplayer/sessions/route';
import { createServiceClient } from '@/lib/supabaseAdmin';

const VALID_CODE = 'ABCD23';
const VALID_MOD_ID = 'mod-user-12345678';
const VALID_APP = {
  appId: 'test-app',
  appName: 'Test App',
  appPath: '/apps/2026/01/01/test-app',
};

function makeRequest(body) {
  return new Request('http://localhost/api/multiplayer/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeClient({ selectResult, insertResult }) {
  const selectChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(selectResult),
  };
  const client = {
    from: jest
      .fn()
      .mockReturnValueOnce(selectChain)
      .mockReturnValueOnce({ insert: jest.fn().mockResolvedValue(insertResult) }),
  };
  createServiceClient.mockReturnValue(client);
  return client;
}

afterEach(() => jest.clearAllMocks());

describe('POST /api/multiplayer/sessions', () => {
  it('returns 503 when createServiceClient returns null', async () => {
    createServiceClient.mockReturnValue(null);
    const res = await POST(
      makeRequest({ code: VALID_CODE, ...VALID_APP, moderatorId: VALID_MOD_ID })
    );
    expect(res.status).toBe(503);
  });

  it('returns 400 for invalid JSON body', async () => {
    createServiceClient.mockReturnValue({});
    const req = new Request('http://localhost/api/multiplayer/sessions', {
      method: 'POST',
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing code', async () => {
    makeClient({ selectResult: { data: null, error: null }, insertResult: { error: null } });
    const res = await POST(makeRequest({ ...VALID_APP, moderatorId: VALID_MOD_ID }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/code/i);
  });

  it('returns 400 for code with banned characters (0, O, 1, I)', async () => {
    makeClient({ selectResult: { data: null, error: null }, insertResult: { error: null } });
    const res = await POST(
      makeRequest({ code: 'ABCD01', ...VALID_APP, moderatorId: VALID_MOD_ID })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for code that is too short', async () => {
    makeClient({ selectResult: { data: null, error: null }, insertResult: { error: null } });
    const res = await POST(makeRequest({ code: 'AB2', ...VALID_APP, moderatorId: VALID_MOD_ID }));
    expect(res.status).toBe(400);
  });

  it('returns 400 for code that is too long', async () => {
    makeClient({ selectResult: { data: null, error: null }, insertResult: { error: null } });
    const res = await POST(
      makeRequest({ code: 'ABCDEFGHJ23', ...VALID_APP, moderatorId: VALID_MOD_ID })
    );
    expect(res.status).toBe(400);
  });

  it('normalizes code to uppercase before validation', async () => {
    makeClient({ selectResult: { data: null, error: null }, insertResult: { error: null } });
    const res = await POST(
      makeRequest({ code: 'abcd23', ...VALID_APP, moderatorId: VALID_MOD_ID })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.code).toBe('ABCD23');
  });

  it('returns 400 for missing appId', async () => {
    makeClient({ selectResult: { data: null, error: null }, insertResult: { error: null } });
    const res = await POST(
      makeRequest({ code: VALID_CODE, appName: 'Test', appPath: '/x', moderatorId: VALID_MOD_ID })
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/metadata/i);
  });

  it('returns 400 for missing appName', async () => {
    makeClient({ selectResult: { data: null, error: null }, insertResult: { error: null } });
    const res = await POST(
      makeRequest({ code: VALID_CODE, appId: 'x', appPath: '/x', moderatorId: VALID_MOD_ID })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing appPath', async () => {
    makeClient({ selectResult: { data: null, error: null }, insertResult: { error: null } });
    const res = await POST(
      makeRequest({ code: VALID_CODE, appId: 'x', appName: 'x', moderatorId: VALID_MOD_ID })
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid moderatorId (too short)', async () => {
    makeClient({ selectResult: { data: null, error: null }, insertResult: { error: null } });
    const res = await POST(makeRequest({ code: VALID_CODE, ...VALID_APP, moderatorId: 'short' }));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/moderator/i);
  });

  it('returns 400 for missing moderatorId', async () => {
    makeClient({ selectResult: { data: null, error: null }, insertResult: { error: null } });
    const res = await POST(makeRequest({ code: VALID_CODE, ...VALID_APP }));
    expect(res.status).toBe(400);
  });

  it('returns 500 when collision check query fails', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    };
    const client = { from: jest.fn().mockReturnValue(selectChain) };
    createServiceClient.mockReturnValue(client);
    const res = await POST(
      makeRequest({ code: VALID_CODE, ...VALID_APP, moderatorId: VALID_MOD_ID })
    );
    expect(res.status).toBe(500);
  });

  it('returns 409 when code already exists (pre-flight check)', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: { code: VALID_CODE }, error: null }),
    };
    const client = { from: jest.fn().mockReturnValue(selectChain) };
    createServiceClient.mockReturnValue(client);
    const res = await POST(
      makeRequest({ code: VALID_CODE, ...VALID_APP, moderatorId: VALID_MOD_ID })
    );
    expect(res.status).toBe(409);
    expect((await res.json()).error).toMatch(/exists/i);
  });

  it('returns 409 on race-condition unique_violation (23505)', async () => {
    makeClient({
      selectResult: { data: null, error: null },
      insertResult: { error: { code: '23505', message: 'duplicate key' } },
    });
    const res = await POST(
      makeRequest({ code: VALID_CODE, ...VALID_APP, moderatorId: VALID_MOD_ID })
    );
    expect(res.status).toBe(409);
  });

  it('returns 500 when insert fails with a non-duplicate error', async () => {
    makeClient({
      selectResult: { data: null, error: null },
      insertResult: { error: { code: '42501', message: 'permission denied' } },
    });
    const res = await POST(
      makeRequest({ code: VALID_CODE, ...VALID_APP, moderatorId: VALID_MOD_ID })
    );
    expect(res.status).toBe(500);
  });

  it('returns 201 with ok and code on success', async () => {
    makeClient({ selectResult: { data: null, error: null }, insertResult: { error: null } });
    const res = await POST(
      makeRequest({ code: VALID_CODE, ...VALID_APP, moderatorId: VALID_MOD_ID })
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ ok: true, code: VALID_CODE });
  });

  it('inserts the row with correct structure', async () => {
    const client = makeClient({
      selectResult: { data: null, error: null },
      insertResult: { error: null },
    });
    await POST(
      makeRequest({
        code: VALID_CODE,
        ...VALID_APP,
        moderatorId: VALID_MOD_ID,
        settings: { maxPlayers: 8 },
      })
    );
    const insertChain = client.from.mock.results[1].value;
    expect(insertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        code: VALID_CODE,
        app_id: VALID_APP.appId,
        app_name: VALID_APP.appName,
        app_path: VALID_APP.appPath,
        moderator_id: VALID_MOD_ID,
        status: 'lobby',
        settings: { maxPlayers: 8 },
        players: {},
        game: null,
      })
    );
  });

  it('uses empty object for settings when not provided', async () => {
    const client = makeClient({
      selectResult: { data: null, error: null },
      insertResult: { error: null },
    });
    await POST(makeRequest({ code: VALID_CODE, ...VALID_APP, moderatorId: VALID_MOD_ID }));
    const insertChain = client.from.mock.results[1].value;
    expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({ settings: {} }));
  });

  it('ignores array settings values and uses empty object fallback', async () => {
    const client = makeClient({
      selectResult: { data: null, error: null },
      insertResult: { error: null },
    });
    await POST(
      makeRequest({
        code: VALID_CODE,
        ...VALID_APP,
        moderatorId: VALID_MOD_ID,
        settings: [1, 2, 3],
      })
    );
    const insertChain = client.from.mock.results[1].value;
    expect(insertChain.insert).toHaveBeenCalledWith(expect.objectContaining({ settings: {} }));
  });
});
