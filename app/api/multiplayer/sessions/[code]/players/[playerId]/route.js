import { createServiceClient } from '@/lib/supabaseAdmin';

const CODE_RE = /^[A-HJ-NP-Z2-9]{4,10}$/;
const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function asString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function PATCH(request, { params }) {
  const resolvedParams = await params;
  const code =
    typeof resolvedParams?.code === 'string' ? resolvedParams.code.trim().toUpperCase() : '';
  const playerId =
    typeof resolvedParams?.playerId === 'string' ? resolvedParams.playerId.trim() : '';

  if (!CODE_RE.test(code)) {
    return Response.json({ error: 'Invalid code' }, { status: 400 });
  }
  if (!ID_RE.test(playerId)) {
    return Response.json({ error: 'Invalid player ID' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Multiplayer unavailable' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const action = asString(body.action);
  if (!action) {
    return Response.json({ error: 'Missing action' }, { status: 400 });
  }

  const { data: row, error: loadError } = await supabase
    .from('multiplayer_sessions')
    .select('players, game')
    .eq('code', code)
    .maybeSingle();

  if (loadError) {
    console.error('Failed to load session for player update', loadError);
    return Response.json({ error: 'Failed to update player' }, { status: 500 });
  }
  if (!row) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const players = structuredClone(row.players || {});
  const game = structuredClone(row.game || {});
  const player = players[playerId];

  if (!player) {
    return Response.json({ error: 'Player not found' }, { status: 404 });
  }

  if (action === 'submitStatements') {
    const statements = Array.isArray(body.statements) ? body.statements : [];
    const lieIndex = Number(body.lieIndex);

    if (statements.length !== 3) {
      return Response.json({ error: 'Expected exactly 3 statements' }, { status: 400 });
    }
    const cleaned = statements.map((entry) => asString(entry));
    if (cleaned.some((entry) => !entry || entry.length > 180)) {
      return Response.json({ error: 'Statements must each be 1-180 characters' }, { status: 400 });
    }
    if (!Number.isInteger(lieIndex) || lieIndex < 0 || lieIndex > 2) {
      return Response.json({ error: 'Invalid lie index' }, { status: 400 });
    }

    player.submission = {
      statements: cleaned,
      lieIndex,
      ready: true,
      submittedAt: new Date().toISOString(),
    };
    players[playerId] = player;
  } else if (action === 'vote') {
    const roundId = asString(body.roundId);
    const statementIndex = Number(body.statementIndex);

    if (!roundId) {
      return Response.json({ error: 'Missing round ID' }, { status: 400 });
    }
    if (!Number.isInteger(statementIndex) || statementIndex < 0 || statementIndex > 2) {
      return Response.json({ error: 'Invalid vote selection' }, { status: 400 });
    }

    if (game.phase !== 'vote' || game.currentRoundId !== roundId) {
      return Response.json({ ok: true, accepted: false, reason: 'round-inactive' });
    }
    if (game.currentSpeakerId === playerId) {
      return Response.json({ ok: true, accepted: false, reason: 'speaker-cannot-vote' });
    }

    player.vote = {
      roundId,
      statementIndex,
      votedAt: new Date().toISOString(),
    };
    players[playerId] = player;
  } else if (action === 'requestHint') {
    if (game.mode !== 'quiz-vote') {
      return Response.json({ ok: true, accepted: false, reason: 'unsupported-mode' });
    }
    if (game.phase !== 'question') {
      return Response.json({ ok: true, accepted: false, reason: 'round-inactive' });
    }

    const hintUsedBy = structuredClone(game.hintUsedBy || {});
    hintUsedBy[playerId] = true;
    game.hintUsedBy = hintUsedBy;
  } else {
    return Response.json({ error: 'Unsupported action' }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from('multiplayer_sessions')
    .update({ players, game })
    .eq('code', code);

  if (updateError) {
    console.error('Failed to persist player update', updateError);
    return Response.json({ error: 'Failed to update player' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
