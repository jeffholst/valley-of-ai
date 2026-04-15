-- Baseline schema for Valley of AI
-- All writes go through Next.js API routes using the service role key.
-- No public insert policies — RLS insert backdoors removed entirely.

-- ── app_votes ──────────────────────────────────────────────────────────────
create table public.app_votes (
  id         bigint generated always as identity primary key,
  app_id     text        not null,
  vote_type  text        not null check (vote_type in ('up', 'down')),
  created_at timestamptz not null default now()
);

create index app_votes_app_id_idx on public.app_votes (app_id);

alter table public.app_votes enable row level security;

create policy "app_votes: public read"
  on public.app_votes for select using (true);
-- No insert policy — all writes go through /api/votes using service role

-- ── versus_votes ───────────────────────────────────────────────────────────
create table public.versus_votes (
  id           bigint generated always as identity primary key,
  versus_id    text        not null,
  voted_app_id text        not null,
  created_at   timestamptz not null default now()
);

create index versus_votes_versus_id_idx on public.versus_votes (versus_id);

alter table public.versus_votes enable row level security;

create policy "versus_votes: public read"
  on public.versus_votes for select using (true);
-- No insert policy — all writes go through /api/versus-votes using service role

-- ── leaderboard_scores ─────────────────────────────────────────────────────
create table public.leaderboard_scores (
  id          bigint generated always as identity primary key,
  app_id      text        not null,
  player_name text        not null,
  score       bigint      not null check (score >= 0),
  created_at  timestamptz not null default now()
);

create index leaderboard_scores_app_id_score_idx
  on public.leaderboard_scores (app_id, score desc);

create index leaderboard_scores_app_id_created_at_idx
  on public.leaderboard_scores (app_id, created_at desc);

alter table public.leaderboard_scores enable row level security;

create policy "leaderboard_scores: public read"
  on public.leaderboard_scores for select using (true);
-- No insert policy — all writes go through /api/scores using service role
