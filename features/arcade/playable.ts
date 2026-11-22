/** Catalog ids served by their own /juegos/<id>/jugar route instead of the generic simulated player. */
export const PLAYABLE_GAME_IDS = ["asteroids", "falling-blocks", "brick-breaker", "snake"] as const;

export type PlayableGameId = (typeof PLAYABLE_GAME_IDS)[number];
