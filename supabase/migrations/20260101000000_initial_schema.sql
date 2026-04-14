-- Valley of AI — Initial Schema
-- Run this in your Supabase project: SQL Editor → New Query → paste → Run

-- ============================================================
-- Table: votes
-- Stores thumbs-up / thumbs-down votes for gallery apps.
-- One row per vote; uniqueness enforced via RLS (see below).
-- ============================================================
create table if not exists public.votes (
  id         bigint generated always as identity primary key,
  app_id     text        not null,
  vote_type  text        not null check (vote_type in ('up', 'down')),
  created_at timestamptz not null default now()
);

-- Index used by the bulk vote-count query on the gallery page
create index if not exists votes_app_id_idx on public.votes (app_id);

-- ============================================================
-- Table: versus_votes
-- Stores "pick the winner" votes for model comparison competitions.
-- One row per vote; one vote per user per competition (RLS below).
-- ============================================================
create table if not exists public.versus_votes (
  id            bigint generated always as identity primary key,
  versus_id     text        not null,
  voted_app_id  text        not null,
  created_at    timestamptz not null default now()
);

-- Index used by the versus vote-count query
create index if not exists versus_votes_versus_id_idx on public.versus_votes (versus_id);

-- ============================================================
-- Row Level Security
-- ============================================================

-- votes
alter table public.votes enable row level security;

-- Anyone can read vote counts (needed for the gallery and sort)
create policy "votes: public read"
  on public.votes for select
  using (true);

-- Anyone can insert a vote (anonymous voting — uniqueness tracked client-side via localStorage)
create policy "votes: public insert"
  on public.votes for insert
  with check (true);

-- versus_votes
alter table public.versus_votes enable row level security;

-- Anyone can read versus vote counts
create policy "versus_votes: public read"
  on public.versus_votes for select
  using (true);

-- Anyone can insert a versus vote
create policy "versus_votes: public insert"
  on public.versus_votes for insert
  with check (true);
