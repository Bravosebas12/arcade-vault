import { describe, expect, it } from "vitest";
import { GAMES } from "@/features/games/data/catalog";
import type { Game, GameCategory } from "@/features/games/model/game";
import { visibleCategories } from "@/features/games/lib/visible-categories";

const game = (id: string, cat: GameCategory): Game => ({
  id,
  title: id.toUpperCase(),
  short: "",
  long: "",
  cat,
  cover: "cover-test",
  color: "cyan",
  best: 0,
  plays: "0",
});

describe("visibleCategories", () => {
  it("keeps TODOS first and only the categories that have games, in CATS order", () => {
    const games = [game("b", "VERSUS"), game("a", "PUZZLE"), game("c", "PUZZLE")];
    expect(visibleCategories(games)).toEqual(["TODOS", "PUZZLE", "VERSUS"]);
  });

  it("returns only TODOS when there are no games", () => {
    expect(visibleCategories([])).toEqual(["TODOS"]);
  });

  it("matches the categories of the current catalog", () => {
    expect(visibleCategories(GAMES)).toEqual(["TODOS", "PUZZLE", "SHOOTER"]);
  });
});
