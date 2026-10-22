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
