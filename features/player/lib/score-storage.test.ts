import { beforeEach, describe, expect, it, vi } from "vitest";
import { appendScore, readScores, SCORES_KEY } from "@/features/player/lib/score-storage";

describe("score-storage", () => {
  beforeEach(() => localStorage.clear());

  it("uses the prototype key", () => {
    expect(SCORES_KEY).toBe("av_scores");
  });

  it("appends entries with a timestamp", () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    appendScore({ game: "caida", score: 500, name: "KAI" });
    appendScore({ game: "rocas", score: 20, name: "INVITADO" });
    expect(readScores()).toEqual([
      { game: "caida", score: 500, name: "KAI", at: 1000 },
      { game: "rocas", score: 20, name: "INVITADO", at: 1000 },
    ]);
    vi.restoreAllMocks();
  });

  it("starts over when the stored value is corrupt", () => {
    localStorage.setItem("av_scores", "{oops");
    expect(readScores()).toEqual([]);
    appendScore({ game: "caida", score: 1, name: "A" });
    expect(readScores()).toHaveLength(1);
  });

  it("starts over when the stored value is not an array", () => {
    localStorage.setItem("av_scores", '{"a":1}');
    expect(readScores()).toEqual([]);
  });
});
