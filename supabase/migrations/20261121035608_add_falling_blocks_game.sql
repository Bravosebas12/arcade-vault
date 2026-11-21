-- SPEC 07: register Caída (falling-blocks) in the leaderboard.
-- Texts copied verbatim from the `caida` entry of features/games/data/catalog.ts (renamed to falling-blocks).
-- max_score: line points multiply by an unbounded level; 10,000,000 only rejects absurd values.
-- Tables, privileges and submit_score already exist (20261121023827_create_games_and_scores.sql).

insert into public.games (id, title, short_description, long_description, category, cover, color, max_score, sort_order)
values (
  'falling-blocks',
  'CAÍDA',
  'Encaja las piezas antes de que el techo te aplaste.',
  'Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.',
  'PUZZLE',
  'cover-tetro',
  'magenta',
  10000000,
  2
);
