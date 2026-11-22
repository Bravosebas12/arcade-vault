-- SPEC 09: register Serpentina (snake) in the leaderboard.
-- Texts copied verbatim from the `snake` entry of features/games/data/catalog.ts.
-- max_score 1000000: the maps repeat forever, so there is no exact ceiling. Clearing map N gives at
-- most 150 × N points (10 fruits × 10N + 1 bonus × 50N); 1,000,000 is about 115 maps, far beyond a real game.
-- Tables, privileges and submit_score already exist (20261121023827_create_games_and_scores.sql).

insert into public.games (id, title, short_description, long_description, category, cover, color, max_score, sort_order)
values (
  'snake',
  'SERPENTINA',
  'Crece sin morder tu propia cola.',
  'Una serpiente de luz recorre cinco mapas buscando frutas de neón. Cada bocado la alarga y cada mapa la hace más veloz. Un movimiento en falso y se devora a sí misma.',
  'ARCADE',
  'cover-snake',
  'green',
  1000000,
  4
);
