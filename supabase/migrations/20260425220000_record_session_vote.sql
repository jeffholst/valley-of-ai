-- Atomic vote-recording helper for the impostor-question game's voting phase.
-- Merges a single player's vote into game.responses using JSONB || merge,
-- preventing the lost-update race that occurs when multiple players submit
-- votes simultaneously in the non-atomic read-modify-write path.
-- The function is SECURITY DEFINER and restricted to the service role,
-- following the same pattern as add_multiplayer_player.
create or replace function public.record_session_vote(
  p_code      text,
  p_player_id text,
  p_voted_for text,
  p_round     int
) returns table (accepted boolean, already_submitted boolean)
language plpgsql
security definer
as $$
declare
  v_player jsonb;
begin
  -- Lock the row so concurrent vote submissions are serialized.
  select players -> p_player_id
    into v_player
    from public.multiplayer_sessions
   where code = p_code
     for update;

  if not found or v_player is null then
    return query select false::boolean, false::boolean;
    return;
  end if;

  -- Idempotency guard: player already voted in this round.
  if coalesce((v_player->>'voteRound')::int, 0) = p_round
     and (v_player->>'lastAnswer') is not null then
    return query select true::boolean, true::boolean;
    return;
  end if;

  -- Atomically merge vote into game.responses and update the player record.
  -- Using || (JSONB merge) on game.responses means concurrent votes for
  -- different players are never clobbered by the last writer.
  update public.multiplayer_sessions
     set game    = jsonb_set(
                     game,
                     '{responses}',
                     coalesce(game->'responses', '{}') || jsonb_build_object(p_player_id, p_voted_for)
                   ),
         players = jsonb_set(
                     players,
                     array[p_player_id],
                     (players -> p_player_id) || jsonb_build_object(
                       'lastAnswer', p_voted_for,
                       'voteRound',  p_round,
                       'updatedAt',  to_char(now() at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
                     )
                   )
   where code = p_code;

  return query select true::boolean, false::boolean;
end;
$$;

-- Restrict to service-role only (same pattern as add_multiplayer_player).
revoke execute on function public.record_session_vote(text, text, text, int) from public;
revoke execute on function public.record_session_vote(text, text, text, int) from anon;
revoke execute on function public.record_session_vote(text, text, text, int) from authenticated;
