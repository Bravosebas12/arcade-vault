// Original neon pixel-art fruits of references/started-games/05-snake/sprites.js (drawn for this
// project). Pure data: render.ts paints them on an offscreen canvas atlas with { x, y, w, h } crops.
import type { FruitType } from "@/features/arcade/snake/engine/constants";

export const FRUIT_SIZE = 12;

/** Palette letters → colors; "." is transparent. */
export const FRUIT_PALETTE: Record<string, string> = {
  r: "#ff2d6f", R: "#ff9cbc", d: "#b0124a", // red / highlight / shade
  g: "#00ff88", G: "#00b862", b: "#8a5a2b", // leaf / dark leaf / stem
  p: "#b44dff", P: "#e2b0ff", q: "#7a1fd1", // grape
  y: "#f5ff00", Y: "#fdffc0", o: "#b8bc00", // lemon
  m: "#ff4f8b", k: "#1a0a14", w: "#ffe0ec", // watermelon flesh / seed / rind light
  s: "#f5ff00", // strawberry seed
  n: "#ffcf3a", N: "#fff1b0", h: "#c8901a", // golden pineapple (bonus)
};

export const FRUIT_PIXELS: Record<FruitType, readonly string[]> = {
  apple: [
    ".....b.gg...",
    ".....bggg...",
    "..rrrbrrrr..",
    ".rRRrrrrrrr.",
    "rRRrrrrrrrrr",
    "rRrrrrrrrrrr",
    "rrrrrrrrrrrd",
    "rrrrrrrrrrdd",
    ".rrrrrrrrrd.",
    ".rrrrrrrrdd.",
    "..rrrrrrdd..",
    "...rr..rr...",
  ],
  cherry: [
    "........gg..",
    ".......g....",
    "......g.g...",
    ".....g...g..",
    "....g.....g.",
    "..rrr...rrr.",
    ".rRrrr.rRrrr",
    ".rRrrr.rRrrr",
    ".rrrrr.rrrrr",
    ".rrrrd.rrrrd",
    "..rdd...rdd.",
    "............",
  ],
  grape: [
    ".....gg.....",
    "....g.......",
    "...ppp.ppp..",
    "..pPpppPppp.",
    "..ppqppppq..",
    "...ppp.ppp..",
    "...pPpppPp..",
    "...ppqppqp..",
    "....ppppp...",
    ".....pPp....",
    ".....pq.....",
    "............",
  ],
  lemon: [
    "............",
    "......g.....",
    "....yyyyy...",
    "..yyYYyyyyy.",
    ".yyYYyyyyyyy",
    "yyYyyyyyyyyo",
    "yyyyyyyyyyoo",
    ".yyyyyyyyyo.",
    "..yyyyyyyoo.",
    "....oooooo..",
    "............",
    "............",
  ],
  watermelon: [
    "............",
    "............",
    "mmmmmmmmmmmm",
    "mmkmmmmmkmmm",
    ".mmmmkmmmmm.",
    ".mmkmmmmkmm.",
    "..mmmmmmmm..",
    "..wmmmmmmw..",
    "...wwwwww...",
    "...GGGGGG...",
    "....GGGG....",
    "............",
  ],
  strawberry: [
    "...g.gg.g...",
    "....gggg....",
    "..rrrrrrrr..",
    ".rrRrsrrrsr.",
    ".rRrrrrsrrr.",
    ".rsrrrrrrrr.",
    "..rrrsrrrsr.",
    "..rrrrrrrr..",
    "...rsrrrr...",
    "...rrrrrr...",
    "....rrrr....",
    ".....rr.....",
  ],
  pineapple: [
    "....g..g....",
    ".....gg.....",
    "....gggg....",
    "...nnnnnn...",
    "..nNnhnNnh..",
    "..nhnNnhnN..",
    "..nNnhnNnh..",
    "..nhnNnhnN..",
    "..nNnhnNnh..",
    "...nhnNnh...",
    "....nnnn....",
    "............",
  ],
};
