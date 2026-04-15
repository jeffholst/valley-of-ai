import { createServiceClient } from '@/lib/supabaseAdmin';

const APP_ID_PATTERN = /^\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+$/;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId');
  const appIds = searchParams.get('appIds');

  if (!appId && !appIds) {
    return Response.json({ error: 'appId or appIds required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }

  if (appId) {
    if (!APP_ID_PATTERN.test(appId)) {
      return Response.json({ error: 'Invalid appId format' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('app_votes')
      .select('vote_type, created_at')
      .eq('app_id', appId);
    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json(data);
  }

  // Bulk: appIds is a comma-separated list
  const ids = appIds.split(',').map((id) => id.trim());
  const invalid = ids.find((id) => !APP_ID_PATTERN.test(id));
  if (invalid !== undefined) {
    return Response.json({ error: `Invalid appId format: ${invalid}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('app_votes')
    .select('app_id, vote_type, created_at')
    .in('app_id', ids);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json(data);
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { appId, voteType } = body ?? {};

  if (!appId || !APP_ID_PATTERN.test(appId)) {
    return Response.json({ error: 'Invalid appId format' }, { status: 400 });
  }
  if (voteType !== 'up' && voteType !== 'down') {
    return Response.json({ error: 'voteType must be "up" or "down"' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const { error } = await supabase.from('app_votes').insert({ app_id: appId, vote_type: voteType });
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ ok: true }, { status: 201 });
}
