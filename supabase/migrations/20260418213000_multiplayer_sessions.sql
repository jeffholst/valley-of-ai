-- Multiplayer session storage for Team Taboo (Supabase-backed replacement
-- for Firebase Realtime Database state).

create table public.multiplayer_sessions (
  code text primary key,
  app_id text not null,
  app_name text not null,
  app_path text not null,
  moderator_id text not null,
  status text not null check (status in ('lobby', 'playing', 'ended')),
  settings jsonb not null default '{}'::jsonb,
  game jsonb,
  players jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint multiplayer_sessions_code_format check (code ~ '^[A-HJ-NP-Z2-9]{4,10}$')
);

create index multiplayer_sessions_created_at_idx
  on public.multiplayer_sessions (created_at desc);

create index multiplayer_sessions_app_id_idx
  on public.multiplayer_sessions (app_id);

create or replace function public.touch_multiplayer_sessions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_multiplayer_sessions_updated_at on public.multiplayer_sessions;
create trigger trg_multiplayer_sessions_updated_at
before update on public.multiplayer_sessions
for each row
execute function public.touch_multiplayer_sessions_updated_at();

alter table public.multiplayer_sessions enable row level security;

create policy "multiplayer_sessions: public read"
  on public.multiplayer_sessions for select using (true);
-- No insert/update/delete policies: all writes go through Next.js API routes
-- using the service role key.
