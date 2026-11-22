/**
 * SERPENTINA maps. The board is 28×20 cells and always has a border wall; each map adds
 * inner wall rectangles { x, y, w, h } (in cells) and a snake spawn (head cell + direction).
 * Every spawn has a free runway of at least 8 cells ahead of the head.
 */
window.SNAKE_MAPS = [
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
