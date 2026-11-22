// Maps of references/started-games/05-snake/maps.js: inner wall rectangles (cells) and the
// snake spawn. The border wall is always added.
import { COLS, ROWS, type Direction } from "@/features/arcade/snake/engine/constants";

export type WallRect = { x: number; y: number; w: number; h: number };
export type SnakeMap = { name: string; walls: readonly WallRect[]; spawn: { x: number; y: number; dir: Direction } };

export const MAPS: readonly SnakeMap[] = [
  { name: "ARENA", walls: [], spawn: { x: 5, y: 10, dir: "right" } },
  {
    name: "PILARES",
    walls: [
      { x: 6, y: 4, w: 2, h: 2 },
      { x: 20, y: 4, w: 2, h: 2 },
      { x: 6, y: 14, w: 2, h: 2 },
      { x: 20, y: 14, w: 2, h: 2 },
    ],
    spawn: { x: 5, y: 10, dir: "right" },
  },
  {
    name: "PASILLOS",
    walls: [
      { x: 5, y: 6, w: 18, h: 1 },
      { x: 5, y: 13, w: 18, h: 1 },
    ],
    spawn: { x: 5, y: 10, dir: "right" },
  },
  {
    name: "CRUZ",
    walls: [
      { x: 13, y: 2, w: 2, h: 5 },
      { x: 13, y: 13, w: 2, h: 5 },
      { x: 4, y: 9, w: 8, h: 2 },
      { x: 16, y: 9, w: 8, h: 2 },
    ],
    spawn: { x: 5, y: 8, dir: "right" },
  },
  {
    name: "LABERINTO",
    walls: [
      { x: 9, y: 1, w: 1, h: 7 },
      { x: 9, y: 12, w: 1, h: 7 },
      { x: 18, y: 1, w: 1, h: 7 },
      { x: 18, y: 12, w: 1, h: 7 },
      { x: 3, y: 5, w: 4, h: 1 },
      { x: 3, y: 14, w: 4, h: 1 },
      { x: 12, y: 5, w: 4, h: 1 },
      { x: 12, y: 14, w: 4, h: 1 },
      { x: 21, y: 5, w: 4, h: 1 },
      { x: 21, y: 14, w: 4, h: 1 },
    ],
    spawn: { x: 4, y: 10, dir: "right" },
  },
];

/** Numeric key of a cell, for wall and occupancy sets. */
export const cellKey = (x: number, y: number) => y * COLS + x;

/** Map of a level: the five maps repeat (level 6 is ARENA again). */
export const mapFor = (level: number): SnakeMap => MAPS[(level - 1) % MAPS.length];

function buildWalls(map: SnakeMap): ReadonlySet<number> {
  const walls = new Set<number>();
  for (let x = 0; x < COLS; x++) walls.add(cellKey(x, 0)).add(cellKey(x, ROWS - 1));
  for (let y = 0; y < ROWS; y++) walls.add(cellKey(0, y)).add(cellKey(COLS - 1, y));
  for (const r of map.walls) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) walls.add(cellKey(x, y));
  return walls;
}

const WALLS = MAPS.map(buildWalls);

/** Wall cells (border included) of a level's map, built once per map. */
export const wallsOf = (level: number): ReadonlySet<number> => WALLS[(level - 1) % MAPS.length];
