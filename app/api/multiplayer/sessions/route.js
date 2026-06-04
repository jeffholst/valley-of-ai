import { createServiceClient } from '@/lib/supabaseAdmin';

const CODE_RE = /^[A-HJ-NP-Z2-9]{4,10}$/;
const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function parseJsonObject(value, fallback = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }
  return fallback;
}

export async function POST(request) {
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

  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
  const appId = typeof body.appId === 'string' ? body.appId.trim() : '';
  const appName = typeof body.appName === 'string' ? body.appName.trim() : '';
  const appPath = typeof body.appPath === 'string' ? body.appPath.trim() : '';
  const moderatorId = typeof body.moderatorId === 'string' ? body.moderatorId.trim() : '';
  const settings = parseJsonObject(body.settings);

  if (!CODE_RE.test(code)) {
    return Response.json({ error: 'Invalid code' }, { status: 400 });
  }
  if (!appId || !appName || !appPath) {
    return Response.json({ error: 'Missing app metadata' }, { status: 400 });
  }
  if (!ID_RE.test(moderatorId)) {
    return Response.json({ error: 'Invalid moderator ID' }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from('multiplayer_sessions')
    .select('code')
    .eq('code', code)
    .maybeSingle();
  if (existingError) {
    console.error('Failed to check session code collision', existingError);
    return Response.json({ error: 'Failed to create session' }, { status: 500 });
  }
  if (existing) {
    return Response.json({ error: 'Code already exists' }, { status: 409 });
  }

  const row = {
    code,
    app_id: appId,
    app_name: appName,
    app_path: appPath,
    moderator_id: moderatorId,
    status: 'lobby',
    settings,
    players: {},
    game: null,
  };

  const { error: insertError } = await supabase.from('multiplayer_sessions').insert(row);
  if (insertError) {
    // 23505 = unique_violation — the code was taken in the race window between
    // the preflight SELECT and this INSERT.
    if (insertError.code === '23505') {
      return Response.json({ error: 'Code already exists' }, { status: 409 });
    }
    console.error('Failed to create multiplayer session', insertError);
    return Response.json({ error: 'Failed to create session' }, { status: 500 });
  }

  return Response.json({ ok: true, code }, { status: 201 });
}
