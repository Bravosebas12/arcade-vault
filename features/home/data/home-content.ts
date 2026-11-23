// Fixed Home content from references/home-about/home.jsx, adapted to the real catalog: game names and
// the game count come from the real games, and the activity section reads Supabase (features/home/lib/activity.ts).

import { GAMES } from "@/features/games/data/catalog";

export type NeonColor = "cyan" | "magenta" | "yellow" | "green";

export type Feature = { icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET"; title: string; desc: string; color: NeonColor };
export type HomeStat = { n: string; u: string; s: string };
/** `ago` is display text, e.g. "hace 2 min". */
export type RecentScore = { player: string; game: string; score: number; ago: string; color: NeonColor };
export type TopPlayer = { rank: number; player: string; score: number };

export const FEATURES: readonly Feature[] = [
  { icon: "GAMEPAD", title: "JUEGOS CLÁSICOS", desc: "Brick Breaker, Falling Blocks, Meteor Storm y Neon Snake. Los clásicos del arcade reinventados con luz de neón, en un solo lugar.", color: "cyan" },
  { icon: "FREE", title: "100% GRATIS", desc: "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.", color: "yellow" },
  { icon: "TROPHY", title: "LADDER BOARDS", desc: "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.", color: "magenta" },
  { icon: "ROCKET", title: "SIEMPRE CRECIENDO", desc: "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.", color: "green" },
];

export const HOME_STATS: readonly HomeStat[] = [
  { n: String(GAMES.length), u: "JUEGOS", s: "Y CONTANDO" },
  { n: "MILES", u: "DE PARTIDAS", s: "JUGADAS CADA DÍA" },
  { n: "GLOBAL", u: "RANKING", s: "COMPITE CON EL MUNDO" },
];

/** Rows of each "ACTIVIDAD EN VIVO" list. */
export const RECENT_SCORES_LIMIT = 7;
export const TOP_PLAYERS_LIMIT = 5;
