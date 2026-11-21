import { describe, expect, it } from "vitest";
import { NO_BEST_SCORE, bestGlobalScore } from "@/features/game-detail/lib/best-global";
import { formatScore } from "@/shared/lib/format";

const row = (rank: number, score: number) => ({ rank, name: "PX_KAI", score, date: "21/11/2026" });

describe("bestGlobalScore", () => {
  it("is the top row's score when there are real scores", () => {
    expect(bestGlobalScore([row(1, 41200), row(2, 20)], 99999)).toBe(formatScore(41200));
    expect(bestGlobalScore([row(1, 20)], 41200)).toBe(formatScore(20));
  });

  it("is a dash when the game has no scores yet", () => {
    expect(NO_BEST_SCORE).toBe("—");
    expect(bestGlobalScore([], 41200)).toBe(NO_BEST_SCORE);
  });

  it("falls back to the catalog figure when Supabase is unavailable", () => {
    expect(bestGlobalScore(null, 41200)).toBe(formatScore(41200));
  });
});
