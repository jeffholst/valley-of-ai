/**
 * @jest-environment node
 */

jest.mock('@/lib/supabaseAdmin', () => ({ createServiceClient: jest.fn() }));

import { GET, POST } from '@/app/api/post-reactions/route';
import { createServiceClient } from '@/lib/supabaseAdmin';
import postsData from '@/data/posts.json';

// Use the first real slug from posts.json so the VALID_SLUGS set accepts it.
const VALID_SLUG = postsData[0].slug;
const VALID_REACTIONS = ['👍', '❤️', '🚀', '🤯'];

function makeGetRequest(slug) {
  const url = slug
    ? `http://localhost/api/post-reactions?slug=${encodeURIComponent(slug)}`
    : 'http://localhost/api/post-reactions';
  return new Request(url);
}

function makePostRequest(body) {
  return new Request('http://localhost/api/post-reactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Builds a Supabase mock that handles GET: from().select().eq().eq() => { count, error }
function makeGetClient(count = 0, error = null) {
  const inner = jest.fn().mockResolvedValue({ count, error });
  const outerChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnValue({ eq: inner }),
  };
  const client = { from: jest.fn().mockReturnValue(outerChain) };
  createServiceClient.mockReturnValue(client);
  return client;
}

// Builds a Supabase mock that handles POST: from().insert() => { error }
function makePostClient(error = null) {
  const client = {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error }),
    }),
  };
  createServiceClient.mockReturnValue(client);
  return client;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/post-reactions', () => {
  it('returns 400 when slug query param is missing', async () => {
    const res = await GET(makeGetRequest(null));
    expect(res.status).toBe(400);
  });

  it('returns 400 when slug is not a known post slug', async () => {
    const res = await GET(makeGetRequest('not-a-real-slug-xyz'));
    expect(res.status).toBe(400);
  });

  it('returns 503 when Supabase client is unavailable', async () => {
    createServiceClient.mockReturnValue(null);
    const res = await GET(makeGetRequest(VALID_SLUG));
    expect(res.status).toBe(503);
  });

  it('returns 200 with reaction counts on success', async () => {
    makeGetClient(3);
    const res = await GET(makeGetRequest(VALID_SLUG));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('counts');
    for (const reaction of VALID_REACTIONS) {
      expect(body.counts[reaction]).toBe(3);
    }
  });

  it('returns 500 when Supabase query returns an error', async () => {
    makeGetClient(null, { message: 'DB error' });
    const res = await GET(makeGetRequest(VALID_SLUG));
    expect(res.status).toBe(500);
  });
});

describe('POST /api/post-reactions', () => {
  it('returns 400 for invalid JSON body', async () => {
    const req = new Request('http://localhost/api/post-reactions', {
      method: 'POST',
      body: 'not-json',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when slug is missing', async () => {
    const res = await POST(makePostRequest({ reaction: '👍' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when slug is not a known post slug', async () => {
    const res = await POST(makePostRequest({ slug: 'not-a-real-slug', reaction: '👍' }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when reaction is missing', async () => {
    const res = await POST(makePostRequest({ slug: VALID_SLUG }));
    expect(res.status).toBe(400);
  });

  it('returns 400 when reaction is not in the valid set', async () => {
    const res = await POST(makePostRequest({ slug: VALID_SLUG, reaction: '😂' }));
    expect(res.status).toBe(400);
  });

  it('returns 503 when Supabase client is unavailable', async () => {
    createServiceClient.mockReturnValue(null);
    const res = await POST(makePostRequest({ slug: VALID_SLUG, reaction: '👍' }));
    expect(res.status).toBe(503);
  });

  it('returns 201 on success', async () => {
    makePostClient();
    const res = await POST(makePostRequest({ slug: VALID_SLUG, reaction: '👍' }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it('returns 500 when Supabase insert returns an error', async () => {
    makePostClient({ message: 'DB error' });
    const res = await POST(makePostRequest({ slug: VALID_SLUG, reaction: '🚀' }));
    expect(res.status).toBe(500);
  });

  it('accepts all valid reactions', async () => {
    for (const reaction of VALID_REACTIONS) {
      makePostClient();
      const res = await POST(makePostRequest({ slug: VALID_SLUG, reaction }));
      expect(res.status).toBe(201);
    }
  });
});
