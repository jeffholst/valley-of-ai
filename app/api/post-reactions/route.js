import { createServiceClient } from '@/lib/supabaseAdmin';

const VALID_REACTIONS = ['👍', '❤️', '🚀', '🤯'];

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  if (!slug || !slug.trim()) {
    return Response.json({ error: 'slug is required' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const { data, error } = await supabase
    .from('post_reactions')
    .select('reaction')
    .eq('post_slug', slug.trim());

  if (error) {
    console.error('Supabase error fetching post reactions:', error);
    return Response.json({ error: 'Failed to fetch reactions' }, { status: 500 });
  }

  const counts = {};
  for (const row of data) {
    counts[row.reaction] = (counts[row.reaction] ?? 0) + 1;
  }

  return Response.json({ counts });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { slug, reaction } = body ?? {};

  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    return Response.json({ error: 'slug must be a non-empty string' }, { status: 400 });
  }
  if (!reaction || !VALID_REACTIONS.includes(reaction)) {
    return Response.json(
      { error: `reaction must be one of: ${VALID_REACTIONS.join(', ')}` },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const { error } = await supabase
    .from('post_reactions')
    .insert({ post_slug: slug.trim(), reaction });

  if (error) {
    console.error('Supabase error inserting post reaction:', error);
    return Response.json({ error: 'Failed to save reaction' }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 201 });
}
