/**
 * @jest-environment node
 */

jest.mock('@/lib/supabaseAdmin', () => ({ createServiceClient: jest.fn() }));

import { GET, PATCH } from '@/app/api/multiplayer/sessions/[code]/route';
import { createServiceClient } from '@/lib/supabaseAdmin';

const VALID_CODE = 'ABCD23';
const VALID_MOD_ID = 'mod-user-12345678';

const SAMPLE_ROW = {
  app_id: 'test-app',
  app_name: 'Test App',
  app_path: '/apps/2026/01/01/test-app',
  moderator_id: VALID_MOD_ID,
  created_at: '2026-01-01T00:00:00Z',
  status: 'lobby',
  settings: { maxPlayers: 4 },
  game: { round: 1 },
  players: { 'player-abc12345': { id: 'player-abc12345', name: 'Alice' } },
};

function makeParams(code = VALID_CODE) {
  return { params: Promise.resolve({ code }) };
}

function makeGetRequest() {
  return new Request(`http://localhost/api/multiplayer/sessions/${VALID_CODE}`);
}

function makePatchRequest(body) {
  return new Request(`http://localhost/api/multiplayer/sessions/${VALID_CODE}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeSelectClient(selectResult) {
  const selectChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(selectResult),
  };
  const client = { from: jest.fn().mockReturnValue(selectChain) };
  createServiceClient.mockReturnValue(client);
  return client;
}

function makeSelectThenUpdateClient(selectResult, updateResult) {
  const selectChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue(selectResult),
  };
  const updateChain = {
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue(updateResult),
  };
  const client = {
    from: jest.fn().mockReturnValueOnce(selectChain).mockReturnValueOnce(updateChain),
  };
  createServiceClient.mockReturnValue(client);
  return client;
}

afterEach(() => jest.clearAllMocks());

// ─── GET ─────────────────────────────────────────────────────────────────────

describe('GET /api/multiplayer/sessions/[code]', () => {
  it('returns 400 for invalid code', async () => {
    const res = await GET(makeGetRequest(), makeParams('BAD!'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for code with banned characters', async () => {
    const res = await GET(makeGetRequest(), makeParams('ABCD01'));
    expect(res.status).toBe(400);
  });

  it('returns 503 when createServiceClient returns null', async () => {
    createServiceClient.mockReturnValue(null);
    const res = await GET(makeGetRequest(), makeParams());
    expect(res.status).toBe(503);
  });

  it('returns 500 on DB error', async () => {
    makeSelectClient({ data: null, error: { message: 'DB error' } });
    const res = await GET(makeGetRequest(), makeParams());
    expect(res.status).toBe(500);
  });

  it('returns 404 when session not found', async () => {
    makeSelectClient({ data: null, error: null });
    const res = await GET(makeGetRequest(), makeParams());
    expect(res.status).toBe(404);
  });

  it('returns 200 with sanitized session on success', async () => {
    makeSelectClient({ data: SAMPLE_ROW, error: null });
    const res = await GET(makeGetRequest(), makeParams());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.session).toEqual({
      appId: SAMPLE_ROW.app_id,
      appName: SAMPLE_ROW.app_name,
      appPath: SAMPLE_ROW.app_path,
      moderatorId: SAMPLE_ROW.moderator_id,
      createdAt: SAMPLE_ROW.created_at,
      status: SAMPLE_ROW.status,
      settings: SAMPLE_ROW.settings,
      game: SAMPLE_ROW.game,
      players: SAMPLE_ROW.players,
    });
  });

  it('normalizes code to uppercase for the DB query', async () => {
    const client = makeSelectClient({ data: SAMPLE_ROW, error: null });
    await GET(makeGetRequest(), makeParams('abcd23'));
    const chain = client.from.mock.results[0].value;
    expect(chain.eq).toHaveBeenCalledWith('code', 'ABCD23');
  });

  it('returns empty objects for null settings/game/players', async () => {
    makeSelectClient({
      data: { ...SAMPLE_ROW, settings: null, game: null, players: null },
      error: null,
    });
    const res = await GET(makeGetRequest(), makeParams());
    const body = await res.json();
    expect(body.session.settings).toEqual({});
    expect(body.session.game).toBeNull();
    expect(body.session.players).toEqual({});
  });
});

// ─── PATCH ───────────────────────────────────────────────────────────────────

describe('PATCH /api/multiplayer/sessions/[code]', () => {
  it('returns 400 for invalid code', async () => {
    const res = await PATCH(makePatchRequest({ moderatorId: VALID_MOD_ID }), makeParams('BAD!'));
    expect(res.status).toBe(400);
  });

  it('returns 503 when createServiceClient returns null', async () => {
    createServiceClient.mockReturnValue(null);
    const res = await PATCH(makePatchRequest({ moderatorId: VALID_MOD_ID }), makeParams());
    expect(res.status).toBe(503);
  });

  it('returns 400 for invalid JSON body', async () => {
    createServiceClient.mockReturnValue({ from: jest.fn() });
    const req = new Request(`http://localhost/api/multiplayer/sessions/${VALID_CODE}`, {
      method: 'PATCH',
      body: 'not-json',
    });
    const res = await PATCH(req, makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid moderatorId', async () => {
    createServiceClient.mockReturnValue({ from: jest.fn() });
    const res = await PATCH(makePatchRequest({ moderatorId: 'short' }), makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 500 on DB load error', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    };
    const client = { from: jest.fn().mockReturnValue(selectChain) };
    createServiceClient.mockReturnValue(client);
    const res = await PATCH(makePatchRequest({ moderatorId: VALID_MOD_ID }), makeParams());
    expect(res.status).toBe(500);
  });

  it('returns 404 when session not found', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    const client = { from: jest.fn().mockReturnValue(selectChain) };
    createServiceClient.mockReturnValue(client);
    const res = await PATCH(makePatchRequest({ moderatorId: VALID_MOD_ID }), makeParams());
    expect(res.status).toBe(404);
  });

  it('returns 403 when moderatorId does not match', async () => {
    makeSelectThenUpdateClient(
      { data: { ...SAMPLE_ROW, moderator_id: 'other-mod-12345' }, error: null },
      { error: null }
    );
    const res = await PATCH(makePatchRequest({ moderatorId: VALID_MOD_ID }), makeParams());
    expect(res.status).toBe(403);
  });

  it('returns 500 on DB update error', async () => {
    makeSelectThenUpdateClient(
      { data: SAMPLE_ROW, error: null },
      { error: { message: 'update failed' } }
    );
    const res = await PATCH(
      makePatchRequest({ moderatorId: VALID_MOD_ID, status: 'playing' }),
      makeParams()
    );
    expect(res.status).toBe(500);
  });

  it('returns 200 on success', async () => {
    makeSelectThenUpdateClient({ data: SAMPLE_ROW, error: null }, { error: null });
    const res = await PATCH(
      makePatchRequest({ moderatorId: VALID_MOD_ID, status: 'playing' }),
      makeParams()
    );
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  it('updates status when a valid value is provided', async () => {
    const client = makeSelectThenUpdateClient({ data: SAMPLE_ROW, error: null }, { error: null });
    await PATCH(makePatchRequest({ moderatorId: VALID_MOD_ID, status: 'ended' }), makeParams());
    const updateChain = client.from.mock.results[1].value;
    expect(updateChain.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'ended' }));
  });

  it('ignores invalid status values', async () => {
    const client = makeSelectThenUpdateClient({ data: SAMPLE_ROW, error: null }, { error: null });
    await PATCH(makePatchRequest({ moderatorId: VALID_MOD_ID, status: 'invalid' }), makeParams());
    const updateChain = client.from.mock.results[1].value;
    const updateArg = updateChain.update.mock.calls[0][0];
    expect(updateArg.status).toBeUndefined();
  });

  it('only writes touched roots for game/ patch', async () => {
    const client = makeSelectThenUpdateClient({ data: SAMPLE_ROW, error: null }, { error: null });
    await PATCH(
      makePatchRequest({ moderatorId: VALID_MOD_ID, patch: { 'game/word': 'banana' } }),
      makeParams()
    );
    const updateChain = client.from.mock.results[1].value;
    const updateArg = updateChain.update.mock.calls[0][0];
    expect(updateArg.game).toBeDefined();
    expect(updateArg.settings).toBeUndefined();
    expect(updateArg.players).toBeUndefined();
    expect(updateArg.game.word).toBe('banana');
  });

  it('only writes touched roots for settings/ patch', async () => {
    const client = makeSelectThenUpdateClient({ data: SAMPLE_ROW, error: null }, { error: null });
    await PATCH(
      makePatchRequest({ moderatorId: VALID_MOD_ID, patch: { 'settings/maxPlayers': 8 } }),
      makeParams()
    );
    const updateChain = client.from.mock.results[1].value;
    const updateArg = updateChain.update.mock.calls[0][0];
    expect(updateArg.settings).toBeDefined();
    expect(updateArg.game).toBeUndefined();
    expect(updateArg.players).toBeUndefined();
    expect(updateArg.settings.maxPlayers).toBe(8);
  });

  it('writes all three roots for unknown-root patch paths', async () => {
    const client = makeSelectThenUpdateClient({ data: SAMPLE_ROW, error: null }, { error: null });
    await PATCH(
      makePatchRequest({ moderatorId: VALID_MOD_ID, patch: { unknownField: 'value' } }),
      makeParams()
    );
    const updateChain = client.from.mock.results[1].value;
    const updateArg = updateChain.update.mock.calls[0][0];
    expect(updateArg.settings).toBeDefined();
    expect(updateArg.game).toBeDefined();
    expect(updateArg.players).toBeDefined();
  });

  it('skips empty update when no status change and no patch keys', async () => {
    const client = makeSelectThenUpdateClient({ data: SAMPLE_ROW, error: null }, { error: null });
    await PATCH(makePatchRequest({ moderatorId: VALID_MOD_ID }), makeParams());
    const updateChain = client.from.mock.results[1].value;
    expect(updateChain.update).toHaveBeenCalledWith({});
  });

  it('patches nested game state correctly', async () => {
    const rowWithGame = {
      ...SAMPLE_ROW,
      game: { round: 1, roundState: 'lobby' },
    };
    const client = makeSelectThenUpdateClient({ data: rowWithGame, error: null }, { error: null });
    await PATCH(
      makePatchRequest({
        moderatorId: VALID_MOD_ID,
        patch: { 'game/roundState': 'active', 'game/word': 'apple' },
      }),
      makeParams()
    );
    const updateChain = client.from.mock.results[1].value;
    const updateArg = updateChain.update.mock.calls[0][0];
    expect(updateArg.game.roundState).toBe('active');
    expect(updateArg.game.word).toBe('apple');
    expect(updateArg.game.round).toBe(1);
  });
});
