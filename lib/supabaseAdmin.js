import { createClient } from '@supabase/supabase-js';

/**
 * Server-side only. Returns a Supabase client using the service role key,
 * which bypasses RLS. Use exclusively in API route handlers.
 * Never import this in components, hooks, or client code.
 * Returns null if env vars are missing (callers must return 503).
 */
export function createServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    return null;
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
