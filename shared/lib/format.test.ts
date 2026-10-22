import { describe, expect, it } from "vitest";
import { formatRank, formatScore } from "@/shared/lib/format";

describe("formatScore", () => {
  it("uses es-ES thousands separators", () => {
    expect(formatScore(184220)).toBe((184220).toLocaleString("es-ES"));
    expect(formatScore(184220)).toMatch(/^184.220$/);
  });

  it("keeps small numbers as is", () => {
    expect(formatScore(24)).toBe("24");
  });
});

describe("formatRank", () => {
  it("pads to two digits", () => {
    expect(formatRank(1)).toBe("01");
    expect(formatRank(12)).toBe("12");
  });
});
