import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  appendScore,
  bestLocalScore,
  PLAYER_NAME_KEY,
  readPlayerName,
  readScores,
  savePlayerName,
  SCORES_KEY,
} from "@/features/player/lib/score-storage";

describe("score-storage", () => {
  beforeEach(() => localStorage.clear());

  it("uses the prototype key", () => {
    expect(SCORES_KEY).toBe("av_scores");
  });

  it("appends entries with a timestamp", () => {
    vi.spyOn(Date, "now").mockReturnValue(1000);
    appendScore({ game: "falling-blocks", score: 500, name: "KAI" });
    appendScore({ game: "asteroids", score: 20, name: "INVITADO" });
    expect(readScores()).toEqual([
      { game: "falling-blocks", score: 500, name: "KAI", at: 1000 },
      { game: "asteroids", score: 20, name: "INVITADO", at: 1000 },
    ]);
    vi.restoreAllMocks();
  });

  it("starts over when the stored value is corrupt", () => {
    localStorage.setItem("av_scores", "{oops");
    expect(readScores()).toEqual([]);
    appendScore({ game: "falling-blocks", score: 1, name: "A" });
    expect(readScores()).toHaveLength(1);
  });

  it("starts over when the stored value is not an array", () => {
    localStorage.setItem("av_scores", '{"a":1}');
    expect(readScores()).toEqual([]);
  });

  describe("bestLocalScore", () => {
    it("returns null when there are no entries", () => {
      expect(bestLocalScore("asteroids")).toBeNull();
    });

    it("returns the highest entry of the game, ignoring other games", () => {
      localStorage.setItem(
        "av_scores",
        JSON.stringify([
          { game: "asteroids", score: 300, name: "A", at: 1 },
          { game: "falling-blocks", score: 9000, name: "B", at: 2 },
          { game: "asteroids", score: 1200, name: "C", at: 3 },
          { game: "asteroids", score: 800, name: "D", at: 4 },
        ]),
      );
      expect(bestLocalScore("asteroids")).toEqual({ game: "asteroids", score: 1200, name: "C", at: 3 });
      expect(bestLocalScore("unknown-game")).toBeNull();
    });

    it("returns null when the stored value is corrupt", () => {
      localStorage.setItem("av_scores", "{oops");
      expect(bestLocalScore("asteroids")).toBeNull();
    });
  });

  describe("player name", () => {
    it("returns null when no name was saved", () => {
      expect(readPlayerName()).toBeNull();
    });

    it("saves the name under av_player_name and reads it back unchanged", () => {
      expect(PLAYER_NAME_KEY).toBe("av_player_name");
      savePlayerName("PX_KAI");
      expect(localStorage.getItem("av_player_name")).not.toBeNull();
      expect(readPlayerName()).toBe("PX_KAI");
      savePlayerName("Ñandú");
      expect(readPlayerName()).toBe("Ñandú");
    });

    it("returns null when the stored value is corrupt or not a string", () => {
      localStorage.setItem("av_player_name", "{oops");
      expect(readPlayerName()).toBeNull();
      localStorage.setItem("av_player_name", "42");
      expect(readPlayerName()).toBeNull();
    });
  });
});
