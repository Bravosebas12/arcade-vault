import { describe, expect, it } from "vitest";
import { arcadeArenaFit, fitArenaScreen } from "@/features/arcade/lib/arena-fit";

const ASTEROIDS = { width: 800, height: 600 };
const FALLING_BLOCKS = { width: 420, height: 600 };

describe("fitArenaScreen", () => {
  it("keeps the 4:3 Asteroids screen size of before", () => {
    expect(fitArenaScreen(ASTEROIDS, { width: 1440, height: 900 })).toEqual({ width: 800, height: 600 });
    expect(fitArenaScreen(ASTEROIDS, { width: 1280, height: 720 })).toEqual({ width: 560, height: 420 });
  });

  it("fits a 7:10 canvas to the available height", () => {
    expect(fitArenaScreen(FALLING_BLOCKS, { width: 1440, height: 900 })).toEqual({ width: 420, height: 600 });
    expect(fitArenaScreen(FALLING_BLOCKS, { width: 1280, height: 720 })).toEqual({ width: 294, height: 420 });
  });

  it("never exceeds the logical canvas size", () => {
    expect(fitArenaScreen(ASTEROIDS, { width: 2560, height: 1440 })).toEqual({ width: 800, height: 600 });
    expect(fitArenaScreen(FALLING_BLOCKS, { width: 2560, height: 1440 })).toEqual({ width: 420, height: 600 });
  });

  it("is limited by the available width too", () => {
    expect(fitArenaScreen(ASTEROIDS, { width: 400, height: 900 })).toEqual({ width: 400, height: 300 });
    expect(fitArenaScreen(FALLING_BLOCKS, { width: 210, height: 900 })).toEqual({ width: 210, height: 300 });
  });

  it("keeps a minimum screen height on very short viewports", () => {
    expect(fitArenaScreen(ASTEROIDS, { width: 1440, height: 400 })).toEqual({ width: 320, height: 240 });
    expect(fitArenaScreen(FALLING_BLOCKS, { width: 1440, height: 400 })).toEqual({ width: 168, height: 240 });
  });
});

describe("arcadeArenaFit", () => {
  it("builds the CRT frame and screen styles from the canvas proportion", () => {
    const fit = arcadeArenaFit(FALLING_BLOCKS);
    expect(fit.frame).toEqual({
      maxWidth: "calc(min(420px, max(168px, calc((100dvh - 300px) * 420 / 600))) + 48px)",
      marginInline: "auto",
    });
    expect(fit.screen).toEqual({ aspectRatio: "420 / 600" });
  });

  it("keeps the Asteroids formula (4:3, capped at 800px)", () => {
    expect(arcadeArenaFit(ASTEROIDS).frame.maxWidth).toBe("calc(min(800px, max(320px, calc((100dvh - 300px) * 800 / 600))) + 48px)");
  });
});
