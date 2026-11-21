import { describe, expect, it } from "vitest";
import { GAMES } from "@/features/games/data/catalog";
import { filterGames } from "@/features/games/lib/filter-games";

const ids = (games: readonly { id: string }[]) => games.map((g) => g.id);

describe("filterGames", () => {
  it("lists the three real games in catalog order", () => {
    expect(ids(GAMES)).toEqual(["brick-breaker", "falling-blocks", "asteroids"]);
  });

  it("returns every game for TODOS and an empty query", () => {
    expect(filterGames(GAMES, "", "TODOS")).toEqual(GAMES);
  });

  it("filters by category", () => {
    expect(ids(filterGames(GAMES, "", "SHOOTER"))).toEqual(["asteroids"]);
    expect(ids(filterGames(GAMES, "", "PUZZLE"))).toEqual(["falling-blocks"]);
    expect(ids(filterGames(GAMES, "", "ARCADE"))).toEqual(["brick-breaker"]);
  });

  it("filters by title ignoring case", () => {
    expect(ids(filterGames(GAMES, "fall", "TODOS"))).toEqual(["falling-blocks"]);
    expect(ids(filterGames(GAMES, "ASTER", "TODOS"))).toEqual(["asteroids"]);
    expect(ids(filterGames(GAMES, "brick", "TODOS"))).toEqual(["brick-breaker"]);
  });

  it("combines query and category", () => {
    expect(ids(filterGames(GAMES, "fall", "SHOOTER"))).toEqual([]);
    expect(ids(filterGames(GAMES, "fall", "PUZZLE"))).toEqual(["falling-blocks"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterGames(GAMES, "zzz", "TODOS")).toEqual([]);
  });
});
