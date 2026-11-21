import { PLAYABLE_GAME_IDS } from "@/features/arcade/playable";
import { GAMES } from "@/features/games/data/catalog";
import { HALL_LEADERBOARD_SIZE, HallOfFameScreen, type HallTab } from "@/features/hall-of-fame/components/HallOfFameScreen";
import { getLeaderboard, getLeaderboardGames } from "@/features/leaderboard/lib/get-leaderboard";

const playable: readonly string[] = PLAYABLE_GAME_IDS;

/** Tabs without Supabase: catalog games in PLAYABLE_GAME_IDS, with seeded rows. Also the Suspense fallback. */
export const fallbackHallTabs = (): HallTab[] =>
  GAMES.filter((g) => playable.includes(g.id)).map((g) => ({ id: g.id, title: g.title, rows: null }));

/** Salón with the real games from public.games and their real top 12 (server only, request time). */
export async function HallOfFameData() {
  const games = await getLeaderboardGames();
  if (!games) return <HallOfFameScreen tabs={fallbackHallTabs()} />;

  const tabs = await Promise.all(
    games.map(async (g): Promise<HallTab> => ({ id: g.id, title: g.title, rows: await getLeaderboard(g.id, HALL_LEADERBOARD_SIZE) })),
  );
  return <HallOfFameScreen tabs={tabs} />;
}
