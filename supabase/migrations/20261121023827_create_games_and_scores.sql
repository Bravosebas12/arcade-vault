-- SPEC 06: real leaderboard.
-- `games` mirrors the catalog fields for real (playable) games only and is read-only for the app.
-- `scores` is publicly readable (without user_id) and only writable through `submit_score`.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.games (
  id                text primary key,
  title             text not null,
  short_description text not null,
  long_description  text not null,
  category          text not null check (category in ('ARCADE', 'PUZZLE', 'SHOOTER', 'VERSUS')),
  cover             text not null check (cover like 'cover-%'),
  color             text not null check (color in ('cyan', 'magenta', 'yellow', 'green')),
  max_score         integer not null check (max_score > 0),
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now()
);

comment on table public.games is 'Real (playable) games. Mirrors features/games/data/catalog.ts; changed only through migrations.';

create table public.scores (
  id          bigint generated always as identity primary key,
  game_id     text not null references public.games (id) on delete restrict,
  player_name text not null check (char_length(player_name) between 1 and 10 and player_name = btrim(player_name)),
  score       integer not null check (score >= 0),
  created_at  timestamptz not null default now(),
  user_id     uuid null references auth.users (id) on delete set null
);

comment on table public.scores is 'Leaderboard entries. Inserted only through public.submit_score.';
comment on column public.scores.user_id is 'Optional: auth.uid() of the player when signed in; null for anonymous players.';

-- Top-N per game: score desc, oldest first on ties.
create index scores_game_top_idx on public.scores (game_id, score desc, created_at asc);
-- Rate-limit lookup (same name and game in the last seconds).
create index scores_game_name_recent_idx on public.scores (game_id, player_name, created_at desc);
-- Foreign key to auth.users.
create index scores_user_id_idx on public.scores (user_id);

-- ---------------------------------------------------------------------------
-- Seed: copied verbatim from the `asteroids` entry of catalog.ts
-- ---------------------------------------------------------------------------

insert into public.games (id, title, short_description, long_description, category, cover, color, max_score, sort_order)
values (
  'asteroids',
  'ASTEROIDES',
  'Pulveriza asteroides en gravedad cero.',
  'Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.',
  'SHOOTER',
  'cover-rocas',
  'yellow',
  1000000,
  1
);

-- ---------------------------------------------------------------------------
-- Row level security and privileges
-- ---------------------------------------------------------------------------

alter table public.games enable row level security;
alter table public.scores enable row level security;

-- Supabase grants all privileges on new public tables to anon/authenticated by default: start from nothing.
revoke all on public.games from anon, authenticated;
revoke all on public.scores from anon, authenticated;

-- games: read-only for everyone.
grant select on public.games to anon, authenticated;
create policy "games are readable by everyone"
  on public.games for select
  to anon, authenticated
  using (true);

-- scores: public read of every column except user_id; no direct writes.
grant select (id, game_id, player_name, score, created_at) on public.scores to anon, authenticated;
create policy "scores are readable by everyone"
  on public.scores for select
  to anon, authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- submit_score: the only way to insert a score
-- ---------------------------------------------------------------------------

create function public.submit_score(p_game_id text, p_player_name text, p_score integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_max_score integer;
begin
  select g.max_score into v_max_score from public.games g where g.id = p_game_id;
  if v_max_score is null then
    raise exception 'unknown_game' using errcode = 'P0001';
  end if;

  if p_score is null or p_score < 0 or p_score > v_max_score then
    raise exception 'score_out_of_range' using errcode = 'P0001';
  end if;

  if p_player_name is null
     or char_length(p_player_name) not between 1 and 10
     or p_player_name <> btrim(p_player_name) then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.scores s
    where s.game_id = p_game_id
      and s.player_name = p_player_name
      and s.created_at > now() - interval '10 seconds'
  ) then
    raise exception 'too_soon' using errcode = 'P0001';
  end if;

  -- user_id always comes from the JWT, never from the caller.
  insert into public.scores (game_id, player_name, score, user_id)
  values (p_game_id, p_player_name, p_score, auth.uid());
end;
$$;

comment on function public.submit_score(text, text, integer) is
  'Validates and inserts a leaderboard score. Errors: unknown_game, score_out_of_range, invalid_name, too_soon.';

revoke execute on function public.submit_score(text, text, integer) from public;
grant execute on function public.submit_score(text, text, integer) to anon, authenticated;
