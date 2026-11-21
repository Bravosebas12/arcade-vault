import { CATS } from "@/features/games/data/catalog";
import type { CategoryFilter, Game } from "@/features/games/model/game";

/** Category chips to show: TODOS plus every category of CATS that has at least one game, in CATS order. */
export function visibleCategories(games: readonly Game[]): readonly CategoryFilter[] {
  return CATS.filter((c) => c === "TODOS" || games.some((g) => g.cat === c));
}
