-- Rename two game titles to English so the whole catalog uses English titles.
-- METEOR STORM avoids a trademarked arcade title; ids and routes stay the same.
-- Must match the titles in features/games/data/catalog.ts.

update public.games set title = 'METEOR STORM' where id = 'asteroids';
update public.games set title = 'NEON SNAKE' where id = 'snake';
