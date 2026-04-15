import { createServiceClient } from '@/lib/supabaseAdmin';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const versusId = searchParams.get('versusId');
  const versusIds = searchParams.get('versusIds');

  if (!versusId && !versusIds) {
    return Response.json({ error: 'versusId or versusIds required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }

  if (versusId) {
    if (!versusId.trim()) {
      return Response.json({ error: 'versusId must be non-empty' }, { status: 400 });
    }
    const { data, error } = await supabase
      .from('versus_votes')
      .select('voted_app_id, created_at')
      .eq('versus_id', versusId);
    if (error) {
      console.error('Supabase error fetching versus votes:', error);
      return Response.json({ error: 'Failed to fetch votes' }, { status: 500 });
    }
    return Response.json(data);
  }

  // Bulk: versusIds is a comma-separated list
  const ids = versusIds.split(',').map((id) => id.trim());
  const invalid = ids.find((id) => !id);
  if (invalid !== undefined) {
    return Response.json({ error: 'versusIds must be non-empty strings' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('versus_votes')
    .select('versus_id, voted_app_id, created_at')
    .in('versus_id', ids);
  if (error) {
    console.error('Supabase error fetching versus votes (bulk):', error);
    return Response.json({ error: 'Failed to fetch votes' }, { status: 500 });
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

  const { versusId, votedAppId } = body ?? {};

  if (!versusId || typeof versusId !== 'string' || !versusId.trim()) {
    return Response.json({ error: 'versusId must be a non-empty string' }, { status: 400 });
  }
  if (!votedAppId || typeof votedAppId !== 'string' || !votedAppId.trim()) {
    return Response.json({ error: 'votedAppId must be a non-empty string' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const { error } = await supabase
    .from('versus_votes')
    .insert({ versus_id: versusId, voted_app_id: votedAppId });
  if (error) {
    console.error('Supabase error inserting versus vote:', error);
    return Response.json({ error: 'Failed to save vote' }, { status: 500 });
  }
  return Response.json({ ok: true }, { status: 201 });
}
