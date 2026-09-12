-- One-time setup for the portfolio's Supabase project.
-- Paste the whole file into Supabase → SQL Editor → Run.
-- Change 'change-me' below to your /admin password before running (re-run that one line to change it later).

create extension if not exists pgcrypto;

-- ---------- doodle wall (shared drawing in the town square) ----------
create table if not exists doodles (
  id bigint generated always as identity primary key,
  created_at timestamptz default now(),
  stroke jsonb not null
);
alter table doodles enable row level security;
drop policy if exists "read" on doodles;   create policy "read"  on doodles for select using (true);
drop policy if exists "write" on doodles;  create policy "write" on doodles for insert with check (true);
drop policy if exists "undo" on doodles;   create policy "undo"  on doodles for delete using (true);  -- lets visitors undo their own last stroke
do $$ begin
  alter publication supabase_realtime add table doodles;   -- live updates for everyone looking at the wall
exception when duplicate_object then null; end $$;

-- ---------- visitor log ----------
create table if not exists events (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  visitor text, session text, type text not null, name text, path text, ref text,
  country text, region text, city text,
  ua text, device text, lang text, tz text, screen text, props jsonb
);
create index if not exists events_ts on events (ts desc);
alter table events enable row level security;
drop policy if exists "anyone can log" on events;
create policy "anyone can log" on events for insert to anon, authenticated with check (true);
-- (no select policy on purpose: visitors can write to the log but never read it)

-- ---------- /admin password ----------
create table if not exists admin_secret (id int primary key default 1, hash text not null);
alter table admin_secret enable row level security;   -- no policies: unreachable through the API

create or replace function set_admin_password(pw text) returns void
  language sql security definer set search_path = public, extensions as $$
  insert into admin_secret (id, hash) values (1, crypt(pw, gen_salt('bf')))
  on conflict (id) do update set hash = excluded.hash;
$$;
revoke execute on function set_admin_password(text) from public, anon, authenticated;

select set_admin_password('change-me');   -- <<< your password

create or replace function admin_events(pw text, days int default 30, max_rows int default 20000)
  returns setof events language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from admin_secret where hash = crypt(pw, hash)) then
    perform pg_sleep(1);
    raise exception 'wrong password';
  end if;
  return query select * from events where ts > now() - make_interval(days => days) order by ts desc limit max_rows;
end $$;
grant execute on function admin_events(text, int, int) to anon;
