import { describe, expect, it } from "vitest";
import { arcadePlayReducer, initialArcadePlayState, type ArcadePlayState } from "@/features/arcade/lib/play-state";

const playing: ArcadePlayState = { ...initialArcadePlayState, stats: { score: 300, lives: 2, level: 2 }, runId: 4 };

describe("arcadePlayReducer", () => {
  it("starts unpaused, not over, unsaved, with no score", () => {
    expect(initialArcadePlayState).toMatchObject({ paused: false, over: false, saved: false, runId: 0 });
    expect(initialArcadePlayState.stats.score).toBe(0);
  });

  it("stats updates score, lives and level", () => {
    const next = arcadePlayReducer(initialArcadePlayState, { type: "stats", stats: { score: 120, lives: 1, level: 3 } });
    expect(next.stats).toEqual({ score: 120, lives: 1, level: 3 });
  });

  it("stats is ignored once the game is over", () => {
    const over = arcadePlayReducer(playing, { type: "end" });
    expect(arcadePlayReducer(over, { type: "stats", stats: { score: 999, lives: 0, level: 9 } })).toBe(over);
  });

  it("togglePause toggles the pause", () => {
    const paused = arcadePlayReducer(playing, { type: "togglePause" });
    expect(paused.paused).toBe(true);
    expect(arcadePlayReducer(paused, { type: "togglePause" }).paused).toBe(false);
  });

  it("togglePause does nothing once the game is over", () => {
    const over = arcadePlayReducer(playing, { type: "end" });
    expect(arcadePlayReducer(over, { type: "togglePause" })).toBe(over);
  });

  it("gameOver ends the game with the notified stats", () => {
    const over = arcadePlayReducer(playing, { type: "gameOver", stats: { score: 450, lives: 0, level: 2 } });
    expect(over.over).toBe(true);
    expect(over.stats).toEqual({ score: 450, lives: 0, level: 2 });
  });

  it("end ends the game keeping the last notified stats", () => {
    const over = arcadePlayReducer(playing, { type: "end" });
    expect(over.over).toBe(true);
    expect(over.stats).toEqual(playing.stats);
  });

  it("ignores a gameOver after end, and an end after gameOver", () => {
    const ended = arcadePlayReducer(playing, { type: "end" });
    expect(arcadePlayReducer(ended, { type: "gameOver", stats: { score: 999, lives: 0, level: 9 } })).toBe(ended);
    const lost = arcadePlayReducer(playing, { type: "gameOver", stats: { score: 450, lives: 0, level: 2 } });
    expect(arcadePlayReducer(lost, { type: "end" })).toBe(lost);
  });

  it("saved marks the score as saved", () => {
    expect(arcadePlayReducer(arcadePlayReducer(playing, { type: "end" }), { type: "saved" }).saved).toBe(true);
  });

  it("restart goes back to the initial state and increments runId", () => {
    const over = arcadePlayReducer(arcadePlayReducer(playing, { type: "end" }), { type: "saved" });
    expect(arcadePlayReducer(over, { type: "restart" })).toEqual({ ...initialArcadePlayState, runId: 5 });
  });
});
