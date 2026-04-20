/**
 * @jest-environment node
 */

jest.mock('@/lib/supabaseAdmin', () => ({ createServiceClient: jest.fn() }));

import { POST } from '@/app/api/multiplayer/sessions/[code]/players/route';
import { createServiceClient } from '@/lib/supabaseAdmin';

const VALID_CODE = 'ABCD23';
const VALID_APP_PATH = '/apps/2026/01/01/test-app';

function makeParams(code = VALID_CODE) {
  return { params: Promise.resolve({ code }) };
}

function makeRequest(body) {
  return new Request(`http://localhost/api/multiplayer/sessions/${VALID_CODE}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeClient({ selectResult, rpcResult }) {
  const selectChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(selectResult),
  };
  const client = {
    from: jest.fn().mockReturnValue(selectChain),
    rpc: jest.fn().mockResolvedValue(rpcResult),
  };
  createServiceClient.mockReturnValue(client);
  return client;
}

afterEach(() => jest.clearAllMocks());

describe('POST /api/multiplayer/sessions/[code]/players', () => {
  it('returns 400 for invalid code', async () => {
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams('BAD!'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for code with banned characters', async () => {
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams('ABCD01'));
    expect(res.status).toBe(400);
  });

  it('returns 503 when createServiceClient returns null', async () => {
    createServiceClient.mockReturnValue(null);
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams());
    expect(res.status).toBe(503);
  });

  it('returns 400 for invalid JSON body', async () => {
    createServiceClient.mockReturnValue({ from: jest.fn(), rpc: jest.fn() });
    const req = new Request(`http://localhost/api/multiplayer/sessions/${VALID_CODE}/players`, {
      method: 'POST',
      body: 'not-json',
    });
    const res = await POST(req, makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 400 for empty name', async () => {
    makeClient({
      selectResult: { data: { app_path: VALID_APP_PATH }, error: null },
      rpcResult: { data: null, error: null },
    });
    const res = await POST(makeRequest({ name: '' }), makeParams());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/name/i);
  });

  it('returns 400 for name that is only whitespace', async () => {
    makeClient({
      selectResult: { data: { app_path: VALID_APP_PATH }, error: null },
      rpcResult: { data: null, error: null },
    });
    const res = await POST(makeRequest({ name: '   ' }), makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 400 for name longer than 30 characters', async () => {
    makeClient({
      selectResult: { data: { app_path: VALID_APP_PATH }, error: null },
      rpcResult: { data: null, error: null },
    });
    const res = await POST(makeRequest({ name: 'A'.repeat(31) }), makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 400 for missing name', async () => {
    makeClient({
      selectResult: { data: { app_path: VALID_APP_PATH }, error: null },
      rpcResult: { data: null, error: null },
    });
    const res = await POST(makeRequest({}), makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 500 on DB load error', async () => {
    makeClient({
      selectResult: { data: null, error: { message: 'DB error' } },
      rpcResult: { data: null, error: null },
    });
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams());
    expect(res.status).toBe(500);
  });

  it('returns 404 when session not found', async () => {
    makeClient({
      selectResult: { data: null, error: null },
      rpcResult: { data: null, error: null },
    });
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams());
    expect(res.status).toBe(404);
  });

  it('returns 500 on RPC error', async () => {
    makeClient({
      selectResult: { data: { app_path: VALID_APP_PATH }, error: null },
      rpcResult: { data: null, error: { message: 'rpc failed' } },
    });
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams());
    expect(res.status).toBe(500);
  });

  it('returns 201 with playerId and appPath on success', async () => {
    makeClient({
      selectResult: { data: { app_path: VALID_APP_PATH }, error: null },
      rpcResult: { data: [{ app_path: VALID_APP_PATH }], error: null },
    });
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams());
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.playerId).toBeDefined();
    expect(body.appPath).toBe(VALID_APP_PATH);
  });

  it('falls back to row.app_path when rpc returns no rows', async () => {
    makeClient({
      selectResult: { data: { app_path: VALID_APP_PATH }, error: null },
      rpcResult: { data: [], error: null },
    });
    const res = await POST(makeRequest({ name: 'Alice' }), makeParams());
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.appPath).toBe(VALID_APP_PATH);
  });

  it('calls rpc with the correct function name and player record', async () => {
    const client = makeClient({
      selectResult: { data: { app_path: VALID_APP_PATH }, error: null },
      rpcResult: { data: [{ app_path: VALID_APP_PATH }], error: null },
    });
    await POST(makeRequest({ name: 'Bob' }), makeParams());
    expect(client.rpc).toHaveBeenCalledWith(
      'add_multiplayer_player',
      expect.objectContaining({
        p_code: VALID_CODE,
        p_player: expect.objectContaining({ name: 'Bob', online: true }),
      })
    );
  });

  it('accepts a name of exactly 30 characters', async () => {
    makeClient({
      selectResult: { data: { app_path: VALID_APP_PATH }, error: null },
      rpcResult: { data: [{ app_path: VALID_APP_PATH }], error: null },
    });
    const res = await POST(makeRequest({ name: 'A'.repeat(30) }), makeParams());
    expect(res.status).toBe(201);
  });
});
