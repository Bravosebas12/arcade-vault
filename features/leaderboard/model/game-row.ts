import type { Game } from "@/features/games/model/game";

/** One row of public.games, already mapped to the catalog field names. */
export type GameRecord = Pick<Game, "id" | "title" | "short" | "long" | "cat" | "cover" | "color"> & {
  maxScore: number;
  sortOrder: number;
};
