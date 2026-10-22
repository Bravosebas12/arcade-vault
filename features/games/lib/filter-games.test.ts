import { describe, expect, it } from "vitest";
import { GAMES } from "@/features/games/data/catalog";
import { filterGames } from "@/features/games/lib/filter-games";

const ids = (games: readonly { id: string }[]) => games.map((g) => g.id);

describe("filterGames", () => {
  it("returns every game for TODOS and an empty query", () => {
    expect(filterGames(GAMES, "", "TODOS")).toEqual(GAMES);
  });

  it("filters by category", () => {
    expect(ids(filterGames(GAMES, "", "SHOOTER"))).toEqual(["invasores", "rocas"]);
  });

  it("filters by title ignoring case", () => {
    expect(ids(filterGames(GAMES, "caí", "TODOS"))).toEqual(["caida"]);
    expect(ids(filterGames(GAMES, "ROCA", "TODOS"))).toEqual(["rocas"]);
  });

  it("combines query and category", () => {
    expect(ids(filterGames(GAMES, "duelo", "ARCADE"))).toEqual([]);
    expect(ids(filterGames(GAMES, "duelo", "VERSUS"))).toEqual(["duelo-pixel"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterGames(GAMES, "zzz", "TODOS")).toEqual([]);
  });
});
