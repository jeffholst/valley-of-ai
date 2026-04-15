import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create a mock client for build-time when env vars are missing
function createMockClient() {
  return {
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ count: 0, data: [], error: null }),
        neq: () => Promise.resolve({ count: 0, data: [], error: null }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: new Error('Supabase not initialized') }),
      }),
      insert: () => Promise.resolve({ error: new Error('Supabase not initialized') }),
      delete: () => ({
        eq: () => Promise.resolve({ error: new Error('Supabase not initialized') }),
      }),
    }),
  };
}

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : createMockClient();

/**
 * Server-side only. Returns a Supabase client authenticated with the service role key,
 * which bypasses RLS. Used exclusively by API routes that write to protected tables
 * (e.g. leaderboard_scores). Never expose this client to the browser.
 * Returns null if env vars are missing (callers should return 503).
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
