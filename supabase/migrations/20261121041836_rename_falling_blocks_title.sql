-- Rename the visible title of the falling-blocks game to match its id (was "CAÍDA").
-- Keeps public.games in sync with features/games/data/catalog.ts.
update public.games
set title = 'FALLING BLOCKS'
where id = 'falling-blocks';
