import { createServiceClient } from '@/lib/supabaseAdmin';

const CODE_RE = /^[A-HJ-NP-Z2-9]{4,10}$/;
const ID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

function toClientSession(row) {
  return {
    appId: row.app_id,
    appName: row.app_name,
    appPath: row.app_path,
    moderatorId: row.moderator_id,
    createdAt: row.created_at,
    status: row.status,
    settings: row.settings || {},
    game: row.game || null,
    players: row.players || {},
  };
}

function applyNestedPatch(target, patch) {
  for (const [path, value] of Object.entries(patch || {})) {
    const keys = String(path).split('/').filter(Boolean);
    if (keys.length === 0 && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.keys(target).forEach((key) => {
        delete target[key];
      });
      Object.assign(target, value);
      continue;
    }
    if (keys.length === 0) {
      continue;
    }
    let cursor = target;
    for (let i = 0; i < keys.length - 1; i += 1) {
      const key = keys[i];
      if (typeof cursor[key] !== 'object' || cursor[key] === null || Array.isArray(cursor[key])) {
        cursor[key] = {};
      }
      cursor = cursor[key];
    }
    cursor[keys[keys.length - 1]] = value;
  }
}

export async function GET(_request, { params }) {
  const code = typeof params?.code === 'string' ? params.code.trim().toUpperCase() : '';
  if (!CODE_RE.test(code)) {
    return Response.json({ error: 'Invalid code' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Multiplayer unavailable' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('multiplayer_sessions')
    .select('app_id, app_name, app_path, moderator_id, created_at, status, settings, game, players')
    .eq('code', code)
    .maybeSingle();

  if (error) {
    console.error('Failed to load multiplayer session', error);
    return Response.json({ error: 'Failed to load session' }, { status: 500 });
  }
  if (!data) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  return Response.json({ session: toClientSession(data) });
}

export async function PATCH(request, { params }) {
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

  const moderatorId = typeof body.moderatorId === 'string' ? body.moderatorId.trim() : '';
  const status = typeof body.status === 'string' ? body.status : null;
  const patch =
    body.patch && typeof body.patch === 'object' && !Array.isArray(body.patch) ? body.patch : {};

  if (!ID_RE.test(moderatorId)) {
    return Response.json({ error: 'Invalid moderator ID' }, { status: 400 });
  }

  const { data: row, error: loadError } = await supabase
    .from('multiplayer_sessions')
    .select('moderator_id, status, settings, game, players')
    .eq('code', code)
    .maybeSingle();

  if (loadError) {
    console.error('Failed to load session for update', loadError);
    return Response.json({ error: 'Failed to update session' }, { status: 500 });
  }
  if (!row) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }
  if (row.moderator_id !== moderatorId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const next = {
    settings: structuredClone(row.settings || {}),
    game: structuredClone(row.game || {}),
    players: structuredClone(row.players || {}),
  };

  // Patch keys are slash-delimited paths rooted at settings/game/players
  // or top-level fields used by the existing app mutation pattern.
  for (const [rawPath, value] of Object.entries(patch)) {
    const parts = String(rawPath).split('/').filter(Boolean);
    if (parts.length === 0) {
      continue;
    }
    const root = parts[0];
    if (root === 'settings' || root === 'game' || root === 'players') {
      applyNestedPatch(next[root], { [parts.slice(1).join('/')]: value });
    } else {
      applyNestedPatch(next, { [rawPath]: value });
    }
  }

  const updateRow = {
    settings: next.settings,
    game: next.game,
    players: next.players,
  };

  if (status === 'lobby' || status === 'playing' || status === 'ended') {
    updateRow.status = status;
  }

  const { error: updateError } = await supabase
    .from('multiplayer_sessions')
    .update(updateRow)
    .eq('code', code);

  if (updateError) {
    console.error('Failed to persist session update', updateError);
    return Response.json({ error: 'Failed to update session' }, { status: 500 });
  }

  return Response.json({ ok: true });
}
