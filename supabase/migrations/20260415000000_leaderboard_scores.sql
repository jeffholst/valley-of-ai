-- Migration: leaderboard_scores
-- Stores per-game high scores submitted through the /api/scores route.
-- Direct public inserts are blocked; all writes go through the API route using the service role key.

create table leaderboard_scores (
  id          bigint generated always as identity primary key,
  app_id      text        not null,
  player_name text        not null,
  score       bigint      not null check (score >= 0),
  created_at  timestamptz not null default now()
);

-- Fast top-10 per game query (ORDER BY score DESC, LIMIT 10)
create index leaderboard_scores_app_id_score_idx
  on leaderboard_scores (app_id, score desc);

-- For potential future "recent scores" or cleanup queries
create index leaderboard_scores_app_id_created_at_idx
  on leaderboard_scores (app_id, created_at desc);

alter table leaderboard_scores enable row level security;

-- Anyone can read scores (used by the public GET /api/scores endpoint and /leaderboard page)
create policy "public read leaderboard"
  on leaderboard_scores for select
  using (true);

-- No direct public inserts — the service role key (used by the Next.js API route) bypasses RLS
-- entirely, so no insert policy is needed here.
