import { createServiceClient } from '@/lib/supabaseAdmin';

const CODE_RE = /^[A-HJ-NP-Z2-9]{4,10}$/;

function generatePlayerId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(request, { params }) {
  const code = typeof params?.code === 'string' ? params.code.trim().toUpperCase() : '';
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

  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 30) {
    return Response.json({ error: 'Name must be 1-30 characters' }, { status: 400 });
  }

  const { data: row, error: loadError } = await supabase
    .from('multiplayer_sessions')
    .select('players, app_path')
    .eq('code', code)
    .maybeSingle();

  if (loadError) {
    console.error('Failed to load session when adding player', loadError);
    return Response.json({ error: 'Failed to join session' }, { status: 500 });
  }
  if (!row) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const players = structuredClone(row.players || {});
  const playerId = generatePlayerId();
  players[playerId] = {
    id: playerId,
    name,
    joinedAt: new Date().toISOString(),
    online: true,
  };

  const { error: updateError } = await supabase
    .from('multiplayer_sessions')
    .update({ players })
    .eq('code', code);

  if (updateError) {
    console.error('Failed to persist player join', updateError);
    return Response.json({ error: 'Failed to join session' }, { status: 500 });
  }

  return Response.json({ playerId, appPath: row.app_path }, { status: 201 });
}
