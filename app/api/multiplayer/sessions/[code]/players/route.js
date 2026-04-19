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

  // First fetch app_path (needed for redirect) and verify session exists.
  const { data: row, error: loadError } = await supabase
    .from('multiplayer_sessions')
    .select('app_path')
    .eq('code', code)
    .maybeSingle();

  if (loadError) {
    console.error('Failed to load session when adding player', loadError);
    return Response.json({ error: 'Failed to join session' }, { status: 500 });
  }
  if (!row) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const playerId = generatePlayerId();
  const playerRecord = {
    id: playerId,
    name,
    joinedAt: new Date().toISOString(),
    online: true,
  };

  // Use an atomic JSONB merge via RPC to avoid lost-update races when two
  // players join at the same time.
  const { data: rpcRows, error: rpcError } = await supabase.rpc('add_multiplayer_player', {
    p_code: code,
    p_player_id: playerId,
    p_player: playerRecord,
  });

  if (rpcError) {
    console.error('Failed to persist player join', rpcError);
    return Response.json({ error: 'Failed to join session' }, { status: 500 });
  }

  const appPath = rpcRows?.[0]?.app_path ?? row.app_path;
  return Response.json({ playerId, appPath }, { status: 201 });
}
