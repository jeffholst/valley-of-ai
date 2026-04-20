/**
 * @jest-environment node
 */

jest.mock('@/lib/supabaseAdmin', () => ({ createServiceClient: jest.fn() }));

import { PATCH } from '@/app/api/multiplayer/sessions/[code]/players/[playerId]/route';
import { createServiceClient } from '@/lib/supabaseAdmin';

const VALID_CODE = 'ABCD23';
const VALID_PLAYER_ID = 'player-abc12345678';
const VALID_ROUND_ID = 'round-id-12345678';

const SAMPLE_PLAYERS = {
  [VALID_PLAYER_ID]: { id: VALID_PLAYER_ID, name: 'Alice', score: 0 },
};

const VOTE_PHASE_GAME = {
  phase: 'vote',
  currentRoundId: VALID_ROUND_ID,
  currentSpeakerId: 'speaker-abc12345678',
};

function makeParams(code = VALID_CODE, playerId = VALID_PLAYER_ID) {
  return { params: Promise.resolve({ code, playerId }) };
}

function makeRequest(body) {
  return new Request(
    `http://localhost/api/multiplayer/sessions/${VALID_CODE}/players/${VALID_PLAYER_ID}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
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

// ─── Shared validation ────────────────────────────────────────────────────────

describe('PATCH /api/multiplayer/sessions/[code]/players/[playerId] — shared validation', () => {
  it('returns 400 for invalid code', async () => {
    const res = await PATCH(makeRequest({ action: 'vote' }), makeParams('BAD!'));
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid playerId (too short)', async () => {
    const res = await PATCH(makeRequest({ action: 'vote' }), makeParams(VALID_CODE, 'short'));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/player/i);
  });

  it('returns 503 when createServiceClient returns null', async () => {
    createServiceClient.mockReturnValue(null);
    const res = await PATCH(makeRequest({ action: 'vote' }), makeParams());
    expect(res.status).toBe(503);
  });

  it('returns 400 for invalid JSON body', async () => {
    createServiceClient.mockReturnValue({ from: jest.fn() });
    const req = new Request(
      `http://localhost/api/multiplayer/sessions/${VALID_CODE}/players/${VALID_PLAYER_ID}`,
      { method: 'PATCH', body: 'not-json' }
    );
    const res = await PATCH(req, makeParams());
    expect(res.status).toBe(400);
  });

  it('returns 400 when action is missing', async () => {
    createServiceClient.mockReturnValue({ from: jest.fn() });
    const res = await PATCH(makeRequest({}), makeParams());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/action/i);
  });

  it('returns 400 for unsupported action', async () => {
    makeSelectThenUpdateClient({ data: { players: SAMPLE_PLAYERS, game: {} }, error: null });
    const res = await PATCH(makeRequest({ action: 'fly' }), makeParams());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/unsupported/i);
  });

  it('returns 500 on DB load error', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
    };
    createServiceClient.mockReturnValue({ from: jest.fn().mockReturnValue(selectChain) });
    const res = await PATCH(makeRequest({ action: 'vote' }), makeParams());
    expect(res.status).toBe(500);
  });

  it('returns 404 when session not found', async () => {
    const selectChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    };
    createServiceClient.mockReturnValue({ from: jest.fn().mockReturnValue(selectChain) });
    const res = await PATCH(makeRequest({ action: 'vote' }), makeParams());
    expect(res.status).toBe(404);
  });

  it('returns 404 when player not found in session', async () => {
    makeSelectThenUpdateClient({
      data: {
        players: { 'other-player-12345678': { id: 'other-player-12345678', name: 'Bob' } },
        game: VOTE_PHASE_GAME,
      },
      error: null,
    });
    const res = await PATCH(
      makeRequest({ action: 'vote', roundId: VALID_ROUND_ID, statementIndex: 1 }),
      makeParams()
    );
    expect(res.status).toBe(404);
  });
});

// ─── submitStatements ─────────────────────────────────────────────────────────

describe('PATCH — action: submitStatements', () => {
  const VALID_STATEMENTS = ['I climbed Everest.', 'I love pizza.', 'I speak five languages.'];

  it('returns 400 for fewer than 3 statements', async () => {
    makeSelectThenUpdateClient({ data: { players: SAMPLE_PLAYERS, game: {} }, error: null });
    const res = await PATCH(
      makeRequest({ action: 'submitStatements', statements: ['Only one.'], lieIndex: 0 }),
      makeParams()
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/3/);
  });

  it('returns 400 for more than 3 statements', async () => {
    makeSelectThenUpdateClient({ data: { players: SAMPLE_PLAYERS, game: {} }, error: null });
    const res = await PATCH(
      makeRequest({
        action: 'submitStatements',
        statements: ['a', 'b', 'c', 'd'],
        lieIndex: 0,
      }),
      makeParams()
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for an empty statement', async () => {
    makeSelectThenUpdateClient({ data: { players: SAMPLE_PLAYERS, game: {} }, error: null });
    const res = await PATCH(
      makeRequest({ action: 'submitStatements', statements: ['a', '', 'c'], lieIndex: 0 }),
      makeParams()
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/1-180/i);
  });

  it('returns 400 for a statement exceeding 180 characters', async () => {
    makeSelectThenUpdateClient({ data: { players: SAMPLE_PLAYERS, game: {} }, error: null });
    const res = await PATCH(
      makeRequest({
        action: 'submitStatements',
        statements: ['a', 'b', 'x'.repeat(181)],
        lieIndex: 0,
      }),
      makeParams()
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for lieIndex below 0', async () => {
    makeSelectThenUpdateClient({ data: { players: SAMPLE_PLAYERS, game: {} }, error: null });
    const res = await PATCH(
      makeRequest({ action: 'submitStatements', statements: VALID_STATEMENTS, lieIndex: -1 }),
      makeParams()
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/lie index/i);
  });

  it('returns 400 for lieIndex above 2', async () => {
    makeSelectThenUpdateClient({ data: { players: SAMPLE_PLAYERS, game: {} }, error: null });
    const res = await PATCH(
      makeRequest({ action: 'submitStatements', statements: VALID_STATEMENTS, lieIndex: 3 }),
      makeParams()
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-integer lieIndex', async () => {
    makeSelectThenUpdateClient({ data: { players: SAMPLE_PLAYERS, game: {} }, error: null });
    const res = await PATCH(
      makeRequest({ action: 'submitStatements', statements: VALID_STATEMENTS, lieIndex: 1.5 }),
      makeParams()
    );
    expect(res.status).toBe(400);
  });

  it('returns 500 on DB update error', async () => {
    makeSelectThenUpdateClient(
      { data: { players: SAMPLE_PLAYERS, game: {} }, error: null },
      { error: { message: 'update failed' } }
    );
    const res = await PATCH(
      makeRequest({ action: 'submitStatements', statements: VALID_STATEMENTS, lieIndex: 2 }),
      makeParams()
    );
    expect(res.status).toBe(500);
  });

  it('returns 200 and stores submission on player', async () => {
    const client = makeSelectThenUpdateClient(
      { data: { players: SAMPLE_PLAYERS, game: {} }, error: null },
      { error: null }
    );
    const res = await PATCH(
      makeRequest({ action: 'submitStatements', statements: VALID_STATEMENTS, lieIndex: 2 }),
      makeParams()
    );
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    const updateChain = client.from.mock.results[1].value;
    const { players } = updateChain.update.mock.calls[0][0];
    expect(players[VALID_PLAYER_ID].submission).toEqual(
      expect.objectContaining({
        statements: VALID_STATEMENTS,
        lieIndex: 2,
        ready: true,
      })
    );
    expect(players[VALID_PLAYER_ID].submission.submittedAt).toBeDefined();
  });

  it('trims whitespace from each statement', async () => {
    const client = makeSelectThenUpdateClient(
      { data: { players: SAMPLE_PLAYERS, game: {} }, error: null },
      { error: null }
    );
    await PATCH(
      makeRequest({
        action: 'submitStatements',
        statements: ['  padded  ', ' also padded ', 'clean'],
        lieIndex: 0,
      }),
      makeParams()
    );
    const updateChain = client.from.mock.results[1].value;
    const { players } = updateChain.update.mock.calls[0][0];
    expect(players[VALID_PLAYER_ID].submission.statements).toEqual([
      'padded',
      'also padded',
      'clean',
    ]);
  });
});

// ─── vote ─────────────────────────────────────────────────────────────────────

describe('PATCH — action: vote', () => {
  it('returns 400 for missing roundId', async () => {
    makeSelectThenUpdateClient({
      data: { players: SAMPLE_PLAYERS, game: VOTE_PHASE_GAME },
      error: null,
    });
    const res = await PATCH(makeRequest({ action: 'vote', statementIndex: 1 }), makeParams());
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/round/i);
  });

  it('returns 400 for statementIndex below 0', async () => {
    makeSelectThenUpdateClient({
      data: { players: SAMPLE_PLAYERS, game: VOTE_PHASE_GAME },
      error: null,
    });
    const res = await PATCH(
      makeRequest({ action: 'vote', roundId: VALID_ROUND_ID, statementIndex: -1 }),
      makeParams()
    );
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/vote/i);
  });

  it('returns 400 for statementIndex above 2', async () => {
    makeSelectThenUpdateClient({
      data: { players: SAMPLE_PLAYERS, game: VOTE_PHASE_GAME },
      error: null,
    });
    const res = await PATCH(
      makeRequest({ action: 'vote', roundId: VALID_ROUND_ID, statementIndex: 3 }),
      makeParams()
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 for non-integer statementIndex', async () => {
    makeSelectThenUpdateClient({
      data: { players: SAMPLE_PLAYERS, game: VOTE_PHASE_GAME },
      error: null,
    });
    const res = await PATCH(
      makeRequest({ action: 'vote', roundId: VALID_ROUND_ID, statementIndex: 0.5 }),
      makeParams()
    );
    expect(res.status).toBe(400);
  });

  it('returns round-inactive when game phase is not vote', async () => {
    makeSelectThenUpdateClient({
      data: {
        players: SAMPLE_PLAYERS,
        game: { ...VOTE_PHASE_GAME, phase: 'reveal' },
      },
      error: null,
    });
    const res = await PATCH(
      makeRequest({ action: 'vote', roundId: VALID_ROUND_ID, statementIndex: 1 }),
      makeParams()
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(false);
    expect(body.reason).toBe('round-inactive');
  });

  it('returns round-inactive when roundId does not match current round', async () => {
    makeSelectThenUpdateClient({
      data: {
        players: SAMPLE_PLAYERS,
        game: { ...VOTE_PHASE_GAME, currentRoundId: 'different-round-12345' },
      },
      error: null,
    });
    const res = await PATCH(
      makeRequest({ action: 'vote', roundId: VALID_ROUND_ID, statementIndex: 1 }),
      makeParams()
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(false);
    expect(body.reason).toBe('round-inactive');
  });

  it('returns speaker-cannot-vote when the player is the current speaker', async () => {
    const speakerId = VALID_PLAYER_ID;
    makeSelectThenUpdateClient({
      data: {
        players: { [speakerId]: { id: speakerId, name: 'Alice' } },
        game: { ...VOTE_PHASE_GAME, currentSpeakerId: speakerId },
      },
      error: null,
    });
    const res = await PATCH(
      makeRequest({ action: 'vote', roundId: VALID_ROUND_ID, statementIndex: 0 }),
      makeParams()
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.accepted).toBe(false);
    expect(body.reason).toBe('speaker-cannot-vote');
  });

  it('returns 500 on DB update error', async () => {
    makeSelectThenUpdateClient(
      { data: { players: SAMPLE_PLAYERS, game: VOTE_PHASE_GAME }, error: null },
      { error: { message: 'update failed' } }
    );
    const res = await PATCH(
      makeRequest({ action: 'vote', roundId: VALID_ROUND_ID, statementIndex: 1 }),
      makeParams()
    );
    expect(res.status).toBe(500);
  });

  it('returns 200 and records vote on player', async () => {
    const client = makeSelectThenUpdateClient(
      { data: { players: SAMPLE_PLAYERS, game: VOTE_PHASE_GAME }, error: null },
      { error: null }
    );
    const res = await PATCH(
      makeRequest({ action: 'vote', roundId: VALID_ROUND_ID, statementIndex: 2 }),
      makeParams()
    );
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    const updateChain = client.from.mock.results[1].value;
    const { players } = updateChain.update.mock.calls[0][0];
    expect(players[VALID_PLAYER_ID].vote).toEqual(
      expect.objectContaining({
        roundId: VALID_ROUND_ID,
        statementIndex: 2,
      })
    );
    expect(players[VALID_PLAYER_ID].vote.votedAt).toBeDefined();
  });
});
