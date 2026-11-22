import { describe, expect, it } from "vitest";
import { COLS, DIRS, ROWS, START_LENGTH } from "@/features/arcade/snake/engine/constants";
import { MAPS, cellKey, mapFor, wallsOf } from "@/features/arcade/snake/engine/maps";

describe("MAPS", () => {
  it("has the five prototype maps in order", () => {
    expect(MAPS.map((m) => m.name)).toEqual(["ARENA", "PILARES", "PASILLOS", "CRUZ", "LABERINTO"]);
  });

  it("repeats the maps after the fifth level", () => {
    expect(mapFor(1)).toBe(MAPS[0]);
    expect(mapFor(5)).toBe(MAPS[4]);
    expect(mapFor(6)).toBe(MAPS[0]);
    expect(mapFor(12)).toBe(MAPS[1]);
  });

  it.each(MAPS.map((m, i) => [m.name, i + 1] as const))("%s has a full border wall", (_, level) => {
    const walls = wallsOf(level);
    for (let x = 0; x < COLS; x++) expect(walls.has(cellKey(x, 0)) && walls.has(cellKey(x, ROWS - 1))).toBe(true);
    for (let y = 0; y < ROWS; y++) expect(walls.has(cellKey(0, y)) && walls.has(cellKey(COLS - 1, y))).toBe(true);
  });

  it.each(MAPS.map((m, i) => [m.name, i + 1] as const))("%s keeps the spawn body and 8 cells ahead free", (_, level) => {
    const { spawn } = mapFor(level);
    const d = DIRS[spawn.dir];
    const walls = wallsOf(level);
    for (let i = -(START_LENGTH - 1); i <= 8; i++) {
      expect(walls.has(cellKey(spawn.x + d.x * i, spawn.y + d.y * i))).toBe(false);
    }
  });

  it("adds the inner walls of each map", () => {
    expect(wallsOf(1).size).toBe(2 * COLS + 2 * (ROWS - 2));
    expect(wallsOf(2).has(cellKey(6, 4))).toBe(true);
    expect(wallsOf(2).has(cellKey(7, 5))).toBe(true);
    expect(wallsOf(3).has(cellKey(22, 13))).toBe(true);
    expect(wallsOf(4).has(cellKey(14, 17))).toBe(true);
    expect(wallsOf(5).has(cellKey(9, 8))).toBe(false); // gap in the maze columns
  });
});
