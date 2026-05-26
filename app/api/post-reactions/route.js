import { createServiceClient } from '@/lib/supabaseAdmin';
import postsData from '@/data/posts.json';

const VALID_REACTIONS = ['👍', '❤️', '🚀', '🤯'];
const VALID_SLUGS = new Set(postsData.map((post) => post.slug));

function normalizeValidSlug(slug) {
  if (!slug || typeof slug !== 'string' || !slug.trim()) {
    return null;
  }

  const normalized = slug.trim();
  if (!VALID_SLUGS.has(normalized)) {
    return null;
  }

  return normalized;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = normalizeValidSlug(searchParams.get('slug'));

  if (!slug) {
    return Response.json({ error: 'slug must be a valid post slug' }, { status: 400 });
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return Response.json({ error: 'Service unavailable' }, { status: 503 });
  }

  const counts = {};
  const results = await Promise.all(
    VALID_REACTIONS.map(async (reaction) => {
      const { count, error } = await supabase
        .from('post_reactions')
        .select('*', { head: true, count: 'exact' })
        .eq('post_slug', slug)
        .eq('reaction', reaction);
      return { reaction, count, error };
    })
  );

  for (const { reaction, count, error } of results) {
    if (error) {
      console.error('Supabase error fetching post reactions:', error);
      return Response.json({ error: 'Failed to fetch reactions' }, { status: 500 });
    }
    counts[reaction] = count ?? 0;
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

  const { slug: rawSlug, reaction } = body ?? {};
  const slug = normalizeValidSlug(rawSlug);

  if (!slug) {
    return Response.json({ error: 'slug must be a valid post slug' }, { status: 400 });
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

  const { error } = await supabase.from('post_reactions').insert({ post_slug: slug, reaction });

  if (error) {
    console.error('Supabase error inserting post reaction:', error);
    return Response.json({ error: 'Failed to save reaction' }, { status: 500 });
  }

  return Response.json({ ok: true }, { status: 201 });
}
