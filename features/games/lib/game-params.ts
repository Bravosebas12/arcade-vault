import { notFound } from "next/navigation";
import { PLAYABLE_GAME_IDS } from "@/features/arcade/playable";
import { findGame, GAMES } from "@/features/games/data/catalog";
import type { Game } from "@/features/games/model/game";

const playable: readonly string[] = PLAYABLE_GAME_IDS;

/** generateStaticParams for /juegos/[id]: every game of the catalog. */
export const allGameStaticParams = () => GAMES.map((g) => ({ id: g.id }));

/**
 * generateStaticParams for /juegos/[id]/jugar: every simulated game. Playable games have their own
 * static /juegos/<id>/jugar route, so the generic route must not generate the same URL.
 */
export const gameStaticParams = () => GAMES.filter((g) => !playable.includes(g.id)).map((g) => ({ id: g.id }));

/** Resolves the [id] param to a game, or renders the 404 page. */
export async function resolveGame(params: Promise<{ id: string }>): Promise<Game> {
  const { id } = await params;
  const game = findGame(id);
  if (!game) notFound();
  return game;
}

/** Catalog game for a route that serves a known id; throws if the catalog lacks it (a programming error). */
export function getGameById(id: string): Game {
  const game = findGame(id);
  if (!game) throw new Error(`Unknown game id: ${id}`);
  return game;
}
