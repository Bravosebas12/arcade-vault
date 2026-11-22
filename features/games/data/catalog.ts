// Copied from references/templates/data.jsx; GAMES keeps only the real (playable) games.
import type { CategoryFilter, Game } from "@/features/games/model/game";

export const GAMES: readonly Game[] = [
  {
    id: "brick-breaker",
    title: "BRICK BREAKER",
    short: "Rebota la pelota y destruye muros de neón.",
    long: "Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?",
    cat: "ARCADE",
    cover: "cover-bricks",
    color: "cyan",
    best: 28450,
    plays: "12.4K",
  },
  {
    id: "falling-blocks",
    title: "FALLING BLOCKS",
    short: "Encaja las piezas antes de que el techo te aplaste.",
    long: "Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.",
    cat: "PUZZLE",
    cover: "cover-tetro",
    color: "magenta",
    best: 184220,
    plays: "31.8K",
  },
  {
    id: "asteroids",
    title: "ASTEROIDES",
    short: "Pulveriza asteroides en gravedad cero.",
    long: "Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.",
    cat: "SHOOTER",
    cover: "cover-rocas",
    color: "yellow",
    best: 41200,
    plays: "15.6K",
  },
  {
    // SPEC 09: prototype "SERPENTINA" entry; the long text now describes the fruits and maps.
    id: "snake",
    title: "SERPENTINA",
    short: "Crece sin morder tu propia cola.",
    long: "Una serpiente de luz recorre cinco mapas buscando frutas de neón. Cada bocado la alarga y cada mapa la hace más veloz. Un movimiento en falso y se devora a sí misma.",
    cat: "ARCADE",
    cover: "cover-snake",
    color: "green",
    best: 7820,
    plays: "9.1K",
  },
];

export const CATS: readonly CategoryFilter[] = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];

export const PLAYERS: readonly string[] = [
  "PX_KAI", "NEONFOX", "Z3R0COOL", "M00NRYU", "VAULT_07", "GLITCHA",
  "ATARI_KID", "CYBER_LU", "MAGENTA88", "SCANLINE", "BIT_LORD", "ARKADYA",
  "DROID_X", "RGB_QUEEN", "PIXEL_DAD", "RETROVIRA", "VECTORX", "JOY_STK",
];

export function findGame(id: string): Game | undefined {
  return GAMES.find((g) => g.id === id);
}
