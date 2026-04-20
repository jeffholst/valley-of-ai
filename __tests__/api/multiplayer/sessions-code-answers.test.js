/**
 * @jest-environment node
 */

jest.mock('@/lib/supabaseAdmin', () => ({ createServiceClient: jest.fn() }));

import { POST } from '@/app/api/multiplayer/sessions/[code]/answers/route';
import { createServiceClient } from '@/lib/supabaseAdmin';

const VALID_CODE = 'ABCD23';
const VALID_PLAYER_ID = 'player-abc12345678';

const ACTIVE_GAME = {
  roundState: 'active',
  word: 'banana',
  roundWinnerId: null,
  roundWinnerName: null,
  solvedRounds: 0,
};

const SAMPLE_PLAYERS = {
  [VALID_PLAYER_ID]: { id: VALID_PLAYER_ID, name: 'Alice', score: 0 },
};

function makeParams(code = VALID_CODE) {
  return { params: Promise.resolve({ code }) };
}

function makeRequest(body) {
  return new Request(`http://localhost/api/multiplayer/sessions/${VALID_CODE}/answers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeSelectThenUpdateClient(selectResult, updateResult = { error: null }) {
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

describe('POST /api/multiplayer/sessions/[code]/answers', () => {
  it('returns 400 for invalid code', async () => {
    const res = await POST(
      makeRequest({ playerId: VALID_PLAYER_ID, guess: 'banana' }),
      makeParams('BAD!')
    );
    expect(res.status).toBe(400);
  });

  it('returns 503 when createServiceClient returns null', async () => {
    createServiceClient.mockReturnValue(null);
    const res = await POST(
      makeRequest({ playerId: VALID_PLAYER_ID, guess: 'banana' }),
      makeParams()
    );
    expect(res.status).toBe(503);
  });

  it('returns 400 for invalid JSON body', async () => {
    createServiceClient.mockReturnValue({ from: jest.fn() });
    const req = new Request(`http://localhost/api/multiplayer/sessions/${VALID_CODE}/answers`, {
      method: 'POST',
      body: 'not-json',
    });
    const res = await POST(req, makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid playerId (too short)', async () => {
    createServiceClient.mockReturnValue({ from: jest.fn() });
    const res = await POST(makeRequest({ playerId: 'short', guess: 'banana' }), makeParams());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/player/i);
  });

  it('returns 400 for missing playerId', async () => {
    createServiceClient.mockReturnValue({ from: jest.fn() });
    const res = await POST(makeRequest({ guess: 'banana' }), makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 500 on DB load error', async () => {
    makeSelectThenUpdateClient({ data: null, error: { message: 'DB error' } });
    const res = await POST(
      makeRequest({ playerId: VALID_PLAYER_ID, guess: 'banana' }),
      makeParams()
    );
    expect(res.status).toBe(500);
  });

  it('returns 404 when session not found', async () => {
    makeSelectThenUpdateClient({ data: null, error: null });
    const res = await POST(
      makeRequest({ playerId: VALID_PLAYER_ID, guess: 'banana' }),
      makeParams()
    );
    expect(res.status).toBe(404);
  });

  it('returns 404 when player not found in session', async () => {
    makeSelectThenUpdateClient({
      data: {
        status: 'playing',
        game: ACTIVE_GAME,
        players: { 'other-player-12345': { id: 'other-player-12345', name: 'Bob' } },
      },
      error: null,
    });
    const res = await POST(
      makeRequest({ playerId: VALID_PLAYER_ID, guess: 'banana' }),
      makeParams()
    );
    expect(res.status).toBe(404);
  });

  it('returns round-inactive when session status is not playing', async () => {
    makeSelectThenUpdateClient({
      data: {
        status: 'lobby',
        game: { ...ACTIVE_GAME, roundState: 'active' },
        players: SAMPLE_PLAYERS,
      },
      error: null,
    });
    const res = await POST(
      makeRequest({ playerId: VALID_PLAYER_ID, guess: 'banana' }),
      makeParams()
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(false);
    expect(body.reason).toBe('round-inactive');
  });

  it('returns round-inactive when roundState is not active', async () => {
    makeSelectThenUpdateClient({
      data: {
        status: 'playing',
        game: { ...ACTIVE_GAME, roundState: 'between' },
        players: SAMPLE_PLAYERS,
      },
      error: null,
    });
    const res = await POST(
      makeRequest({ playerId: VALID_PLAYER_ID, guess: 'banana' }),
      makeParams()
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(false);
    expect(body.reason).toBe('round-inactive');
  });

  it('includes current winner info in round-inactive response', async () => {
    makeSelectThenUpdateClient({
      data: {
        status: 'playing',
        game: {
          ...ACTIVE_GAME,
          roundState: 'between',
          roundWinnerId: 'winner-id-12345',
          roundWinnerName: 'Bob',
        },
        players: SAMPLE_PLAYERS,
      },
      error: null,
    });
    const res = await POST(
      makeRequest({ playerId: VALID_PLAYER_ID, guess: 'banana' }),
      makeParams()
    );
    const body = await res.json();
    expect(body.winnerId).toBe('winner-id-12345');
    expect(body.winnerName).toBe('Bob');
  });

  it('returns incorrect for wrong guess', async () => {
    makeSelectThenUpdateClient({
      data: { status: 'playing', game: ACTIVE_GAME, players: SAMPLE_PLAYERS },
      error: null,
    });
    const res = await POST(
      makeRequest({ playerId: VALID_PLAYER_ID, guess: 'apple' }),
      makeParams()
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(false);
    expect(body.reason).toBe('incorrect');
  });

  it('is case-insensitive for answer matching', async () => {
    const client = makeSelectThenUpdateClient(
      { data: { status: 'playing', game: ACTIVE_GAME, players: SAMPLE_PLAYERS }, error: null },
      { error: null }
    );
    const res = await POST(
      makeRequest({ playerId: VALID_PLAYER_ID, guess: 'BANANA' }),
      makeParams()
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(true);
    expect(body.alreadyAwarded).toBe(false);
    // Verify DB was actually updated (not a dry-run)
    const updateChain = client.from.mock.results[1].value;
    expect(updateChain.update).toHaveBeenCalled();
  });

  it('returns already-awarded when another player already won', async () => {
    makeSelectThenUpdateClient({
      data: {
        status: 'playing',
        game: { ...ACTIVE_GAME, roundWinnerId: 'other-player-12345', roundWinnerName: 'Bob' },
        players: SAMPLE_PLAYERS,
      },
      error: null,
    });
    const res = await POST(
      makeRequest({ playerId: VALID_PLAYER_ID, guess: 'banana' }),
      makeParams()
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(true);
    expect(body.alreadyAwarded).toBe(true);
    expect(body.winnerId).toBe('other-player-12345');
  });

  it('returns 500 when DB update fails', async () => {
    makeSelectThenUpdateClient(
      { data: { status: 'playing', game: ACTIVE_GAME, players: SAMPLE_PLAYERS }, error: null },
      { error: { message: 'update failed' } }
    );
    const res = await POST(
      makeRequest({ playerId: VALID_PLAYER_ID, guess: 'banana' }),
      makeParams()
    );
    expect(res.status).toBe(500);
  });

  it('returns 200 with winner info on correct first answer', async () => {
    makeSelectThenUpdateClient(
      { data: { status: 'playing', game: ACTIVE_GAME, players: SAMPLE_PLAYERS }, error: null },
      { error: null }
    );
    const res = await POST(
      makeRequest({ playerId: VALID_PLAYER_ID, guess: 'banana' }),
      makeParams()
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.accepted).toBe(true);
    expect(body.alreadyAwarded).toBe(false);
    expect(body.winnerId).toBe(VALID_PLAYER_ID);
    expect(body.winnerName).toBe('Alice');
  });

  it('awards a point and updates game state on correct answer', async () => {
    const client = makeSelectThenUpdateClient(
      { data: { status: 'playing', game: ACTIVE_GAME, players: SAMPLE_PLAYERS }, error: null },
      { error: null }
    );
    await POST(makeRequest({ playerId: VALID_PLAYER_ID, guess: 'banana' }), makeParams());
    const updateChain = client.from.mock.results[1].value;
    const { players, game } = updateChain.update.mock.calls[0][0];
    expect(players[VALID_PLAYER_ID].score).toBe(1);
    expect(game.roundWinnerId).toBe(VALID_PLAYER_ID);
    expect(game.roundState).toBe('between');
    expect(game.solvedRounds).toBe(1);
    expect(game.roundWinnerAt).toBeDefined();
  });
});
