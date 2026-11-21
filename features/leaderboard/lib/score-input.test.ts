import { describe, expect, it } from "vitest";
import { isValidPlayerName, PLAYER_NAME_MAX, toPlayerName } from "@/features/leaderboard/lib/score-input";

describe("toPlayerName", () => {
  it("trims surrounding spaces", () => {
    expect(toPlayerName("  PX_KAI ")).toBe("PX_KAI");
  });

  it("keeps case and characters untouched", () => {
    expect(toPlayerName("Ñandú")).toBe("Ñandú");
  });

  it("falls back to INVITADO when empty or blank", () => {
    expect(toPlayerName("")).toBe("INVITADO");
    expect(toPlayerName("   ")).toBe("INVITADO");
  });
});

describe("isValidPlayerName", () => {
  it("allows up to 10 characters", () => {
    expect(PLAYER_NAME_MAX).toBe(10);
    expect(isValidPlayerName("A")).toBe(true);
    expect(isValidPlayerName("ABCDEFGHIJ")).toBe(true);
  });

  it("rejects empty strings", () => {
    expect(isValidPlayerName("")).toBe(false);
  });

  it("rejects names longer than 10 characters", () => {
    expect(isValidPlayerName("ABCDEFGHIJK")).toBe(false);
  });

  it("rejects leading or trailing spaces", () => {
    expect(isValidPlayerName(" KAI")).toBe(false);
    expect(isValidPlayerName("KAI ")).toBe(false);
  });
});
