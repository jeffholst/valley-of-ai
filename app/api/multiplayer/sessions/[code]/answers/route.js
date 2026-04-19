import { createServiceClient } from '@/lib/supabaseAdmin';

const CODE_RE = /^[A-HJ-NP-Z2-9]{4,10}$/;
const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

export async function POST(request, { params }) {
  const resolvedParams = await params;
  const code =
    typeof resolvedParams?.code === 'string' ? resolvedParams.code.trim().toUpperCase() : '';
  if (!CODE_RE.test(code)) {
    return Response.json({ error: 'Invalid code' }, { status: 400 });
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

  const playerId = typeof body.playerId === 'string' ? body.playerId.trim() : '';
  const guess = typeof body.guess === 'string' ? body.guess : '';

  if (!ID_RE.test(playerId)) {
    return Response.json({ error: 'Invalid player ID' }, { status: 400 });
  }

  const { data: row, error: loadError } = await supabase
    .from('multiplayer_sessions')
    .select('status, game, players')
    .eq('code', code)
    .maybeSingle();

  if (loadError) {
    console.error('Failed to load session for answer submit', loadError);
    return Response.json({ error: 'Failed to submit answer' }, { status: 500 });
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

  if (row.status !== 'playing' || game.roundState !== 'active') {
    return Response.json({
      ok: true,
      accepted: false,
      reason: 'round-inactive',
      winnerId: game.roundWinnerId || null,
      winnerName: game.roundWinnerName || null,
    });
  }

  const correctAnswer = normalize(game.word);
  if (!correctAnswer || normalize(guess) !== correctAnswer) {
    return Response.json({ ok: true, accepted: false, reason: 'incorrect' });
  }

  if (game.roundWinnerId) {
    return Response.json({
      ok: true,
      accepted: true,
      alreadyAwarded: true,
      winnerId: game.roundWinnerId,
      winnerName: game.roundWinnerName || null,
    });
  }

  player.score = Number(player.score || 0) + 1;
  players[playerId] = player;

  game.roundWinnerId = playerId;
  game.roundWinnerName = player.name || 'Player';
  game.roundWinnerAt = new Date().toISOString();
  game.roundState = 'between';
  game.solvedRounds = Number(game.solvedRounds || 0) + 1;
  game.announcement = `${game.roundWinnerName} answered correctly first.`;

  const { error: updateError } = await supabase
    .from('multiplayer_sessions')
    .update({ players, game })
    .eq('code', code);

  if (updateError) {
    console.error('Failed to persist winner update', updateError);
    return Response.json({ error: 'Failed to submit answer' }, { status: 500 });
  }

  return Response.json({
    ok: true,
    accepted: true,
    winnerId: playerId,
    winnerName: game.roundWinnerName,
    alreadyAwarded: false,
  });
}
