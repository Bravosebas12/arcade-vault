import type { SavedScore } from "@/features/player/model/score-entry";
import { readJson, writeJson } from "@/shared/lib/safe-storage";

export const SCORES_KEY = "av_scores";

export function readScores(): SavedScore[] {
  const value = readJson<unknown>(SCORES_KEY, []);
  return Array.isArray(value) ? (value as SavedScore[]) : [];
}

export function appendScore(entry: Omit<SavedScore, "at">): void {
  writeJson(SCORES_KEY, [...readScores(), { ...entry, at: Date.now() }]);
}

/** Highest saved score of this browser for a game (first one wins on ties), or null. */
export function bestLocalScore(gameId: string): SavedScore | null {
  let best: SavedScore | null = null;
  for (const entry of readScores()) {
    if (entry?.game !== gameId || typeof entry.score !== "number") continue;
    if (best === null || entry.score > best.score) best = entry;
  }
  return best;
}

export const PLAYER_NAME_KEY = "av_player_name";

/** Last name saved from a real game, or null. */
export function readPlayerName(): string | null {
  const value = readJson<unknown>(PLAYER_NAME_KEY, null);
  return typeof value === "string" ? value : null;
}

export function savePlayerName(name: string): void {
  writeJson(PLAYER_NAME_KEY, name);
}
