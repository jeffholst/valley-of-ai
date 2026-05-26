-- post_reactions: emoji reactions for Experiment Log posts
-- All writes go through /api/post-reactions using the service role key.
-- No public insert policy — RLS insert backdoors removed entirely.

create table public.post_reactions (
  id          bigint generated always as identity primary key,
  post_slug   text        not null,
  reaction    text        not null check (reaction in ('👍', '❤️', '🚀', '🤯')),
  created_at  timestamptz not null default now()
);

create index post_reactions_slug_idx on public.post_reactions (post_slug);
create index post_reactions_slug_reaction_idx on public.post_reactions (post_slug, reaction);

alter table public.post_reactions enable row level security;

create policy "post_reactions: public read"
  on public.post_reactions for select using (true);
-- No insert policy — all writes go through /api/post-reactions using service role
