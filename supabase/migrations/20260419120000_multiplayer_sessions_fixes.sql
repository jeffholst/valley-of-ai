-- Remove the public SELECT policy from multiplayer_sessions.
-- All reads and writes go through Next.js API routes using the service role
-- key, which bypasses RLS entirely. The public policy was unnecessary and
-- would expose player names and game state to any Supabase client holding
-- the anon key.
drop policy if exists "multiplayer_sessions: public read" on public.multiplayer_sessions;

-- Atomic player-join helper.
-- Merges a single new player into the players JSONB column in one UPDATE
-- statement, avoiding the read-modify-write race that can drop concurrent
-- joins.  Returns the updated players map and app_path so callers don't need
-- a second SELECT.
create or replace function public.add_multiplayer_player(
  p_code     text,
  p_player_id text,
  p_player   jsonb
) returns table (players jsonb, app_path text)
language plpgsql
security definer
as $$
begin
  return query
    update public.multiplayer_sessions
       set players = players || jsonb_build_object(p_player_id, p_player)
     where code = p_code
    returning multiplayer_sessions.players, multiplayer_sessions.app_path;
end;
$$;
