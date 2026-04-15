import { verifyTurnstile } from '@/lib/turnstile';
import { supabase, createServiceClient } from '@/lib/supabase';
import { isClean } from './profanity';
import appsData from '@/data/apps.json';

// App IDs follow the format YYYY/MM/DD/slug (e.g. "2026/03/21/my-app")
const APP_ID_RE = /^\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+$/;

// Player names: 2–20 chars, letters/numbers/spaces/dashes/underscores only
const PLAYER_NAME_RE = /^[a-zA-Z0-9 _\-]{2,20}$/;

/**
 * GET /api/scores?appId=YYYY/MM/DD/app-id
 * Returns the top 10 scores for the given app, ordered by score descending.
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId');

  if (!appId || !APP_ID_RE.test(appId)) {
    return Response.json({ error: 'Invalid app ID' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('leaderboard_scores')
    .select('player_name, score, created_at')
    .eq('app_id', appId)
    .order('score', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Supabase error fetching scores:', error);
    return Response.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }

  const scores = (data || []).map((row, i) => ({
    rank: i + 1,
    player_name: row.player_name,
    score: row.score,
    created_at: row.created_at,
  }));

  return Response.json({ scores });
}

/**
 * POST /api/scores
 * Body: { appId, playerName, score, turnstileToken }
 * Submits a new high score for the given app after validating all inputs.
 * Returns the updated top 10 on success.
 */
export async function POST(request) {
  const serviceClient = createServiceClient();
  if (!serviceClient) {
    return Response.json({ error: 'Leaderboard unavailable' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { appId, playerName, score, turnstileToken } = body;

  // Validate appId
  if (!appId || !APP_ID_RE.test(appId)) {
    return Response.json({ error: 'Invalid app ID' }, { status: 400 });
  }

  const appEntry = appsData.find((a) => a.id === appId);
  if (!appEntry) {
    return Response.json({ error: 'Unknown app' }, { status: 400 });
  }

  // Validate score
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0) {
    return Response.json({ error: 'Score must be a non-negative integer' }, { status: 400 });
  }

  // Enforce per-game max score if configured in meta.json / apps.json
  if (typeof appEntry.maxScore === 'number' && score > appEntry.maxScore) {
    return Response.json({ error: 'Score exceeds maximum allowed value' }, { status: 400 });
  }

  // Validate player name format
  if (!playerName || !PLAYER_NAME_RE.test(playerName)) {
    return Response.json(
      { error: 'Player name must be 2–20 characters (letters, numbers, spaces, - or _)' },
      { status: 400 }
    );
  }

  // Profanity check on player name
  if (!isClean(playerName)) {
    return Response.json({ error: 'Player name contains disallowed content' }, { status: 422 });
  }

  // Verify Turnstile bot protection (skipped in development)
  if (process.env.NODE_ENV !== 'development') {
    if (!turnstileToken) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }
    let ip = request.headers.get('cf-connecting-ip')?.trim() || '';
    if (!ip) {
      const xff = request.headers.get('x-forwarded-for') || '';
      if (xff) {
        ip =
          xff
            .split(',')
            .map((part) => part.trim())
            .find((part) => part.length > 0) || '';
      }
    }
    const turnstileOk = await verifyTurnstile(turnstileToken, ip);
    if (!turnstileOk) {
      return Response.json({ error: 'Bot verification failed' }, { status: 403 });
    }
  }

  // Insert score via service role client (bypasses RLS)
  const { error: insertError } = await serviceClient.from('leaderboard_scores').insert({
    app_id: appId,
    player_name: playerName.trim(),
    score,
  });

  if (insertError) {
    console.error('Supabase error inserting score:', insertError);
    return Response.json({ error: 'Failed to save score' }, { status: 500 });
  }

  // Return updated top 10
  const { data, error: fetchError } = await serviceClient
    .from('leaderboard_scores')
    .select('player_name, score, created_at')
    .eq('app_id', appId)
    .order('score', { ascending: false })
    .limit(10);

  if (fetchError) {
    // Score was saved; return empty board rather than failing
    return Response.json({ scores: [] }, { status: 201 });
  }

  const scores = (data || []).map((row, i) => ({
    rank: i + 1,
    player_name: row.player_name,
    score: row.score,
    created_at: row.created_at,
  }));

  return Response.json({ scores }, { status: 201 });
}
