-- SPEC 08: register Brick Breaker (brick-breaker) in the leaderboard.
-- Texts copied verbatim from the `brick-breaker` entry of features/games/data/catalog.ts.
-- max_score 2080 is the real ceiling of the game: 208 blocks across the 5 levels × 10 points.
-- Tables, privileges and submit_score already exist (20261121023827_create_games_and_scores.sql).

insert into public.games (id, title, short_description, long_description, category, cover, color, max_score, sort_order)
values (
  'brick-breaker',
  'BRICK BREAKER',
  'Rebota la pelota y destruye muros de neón.',
  'Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?',
  'ARCADE',
  'cover-bricks',
  'cyan',
  2080,
  3
);
