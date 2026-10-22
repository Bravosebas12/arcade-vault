import type { CategoryFilter, Game } from "@/features/games/model/game";

export function filterGames(games: readonly Game[], query: string, category: CategoryFilter): readonly Game[] {
  const q = query.toLowerCase();
  return games.filter((g) => (category === "TODOS" || g.cat === category) && g.title.toLowerCase().includes(q));
}
