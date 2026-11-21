import { describe, expect, it } from "vitest";
import { MAX_HUD_SCALE, hudScale } from "@/features/arcade/lib/hud-scale";

describe("hudScale", () => {
  it("is 1 when the canvas is shown at its logical width or larger", () => {
    expect(hudScale(800, 800)).toBe(1);
    expect(hudScale(800, 1004)).toBe(1);
  });

  it("compensates a smaller displayed width", () => {
    expect(hudScale(800, 400)).toBe(2);
    expect(hudScale(800, 640)).toBeCloseTo(1.25);
  });

  it("never exceeds the maximum", () => {
    expect(MAX_HUD_SCALE).toBe(2.4);
    expect(hudScale(800, 310)).toBe(MAX_HUD_SCALE);
    expect(hudScale(800, 100)).toBe(MAX_HUD_SCALE);
  });

  it("is 1 for an unmeasured or invalid width", () => {
    expect(hudScale(800, 0)).toBe(1);
    expect(hudScale(800, -5)).toBe(1);
    expect(hudScale(800, Number.NaN)).toBe(1);
  });
});
