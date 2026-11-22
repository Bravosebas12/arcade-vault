/**
 * SPRITE_ATLAS — original neon pixel-art fruits for SERPENTINA (Arcade Vault).
 * Drawn for this project (no third-party art). Each fruit is a 12×12 pixel map; at load
 * they are painted side by side on an offscreen canvas, and SPRITE_ATLAS keeps the same
 * { x, y, w, h } crop format as a regular sprite sheet:
 *
 *   const a = window.SPRITE_ATLAS;
 *   ctx.drawImage(a.image, a.fruits.apple.x, a.fruits.apple.y, a.fruits.apple.w, a.fruits.apple.h, dx, dy, dw, dh);
 *
 * Palette letters → colors; "." is transparent.
 */
(() => {
  const SIZE = 12;

  const PALETTE = {
    r: "#ff2d6f", R: "#ff9cbc", d: "#b0124a", // red / highlight / shade
    g: "#00ff88", G: "#00b862", b: "#8a5a2b", // leaf / dark leaf / stem
    p: "#b44dff", P: "#e2b0ff", q: "#7a1fd1", // grape
    y: "#f5ff00", Y: "#fdffc0", o: "#b8bc00", // lemon
    m: "#ff4f8b", k: "#1a0a14", w: "#ffe0ec", // watermelon flesh / seed / rind light
    s: "#f5ff00",                             // strawberry seed
    n: "#ffcf3a", N: "#fff1b0", h: "#c8901a", // golden pineapple (bonus)
  };

  const PIXELS = {
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

  const names = Object.keys(PIXELS);
  const image = document.createElement("canvas");
  image.width = names.length * SIZE;
  image.height = SIZE;
  const ctx = image.getContext("2d");
  const fruits = {};

  names.forEach((name, i) => {
    const rows = PIXELS[name];
    if (rows.length !== SIZE || rows.some((r) => r.length !== SIZE)) console.warn(`[sprites] ${name} is not ${SIZE}×${SIZE}`);
    rows.forEach((row, y) => {
      [...row].forEach((ch, x) => {
        if (ch === "." || !PALETTE[ch]) return;
        ctx.fillStyle = PALETTE[ch];
        ctx.fillRect(i * SIZE + x, y, 1, 1);
      });
    });
    fruits[name] = { x: i * SIZE, y: 0, w: SIZE, h: SIZE };
  });

  window.SPRITE_ATLAS = { image, fruits };
})();
