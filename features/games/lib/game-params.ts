import { notFound } from "next/navigation";
import { findGame, GAMES } from "@/features/games/data/catalog";
import type { Game } from "@/features/games/model/game";

/** generateStaticParams for every /juegos/[id] route. */
export const gameStaticParams = () => GAMES.map((g) => ({ id: g.id }));

/** Resolves the [id] param to a game, or renders the 404 page. */
export async function resolveGame(params: Promise<{ id: string }>): Promise<Game> {
  const { id } = await params;
  const game = findGame(id);
  if (!game) notFound();
  return game;
}
