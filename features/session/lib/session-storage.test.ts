import { beforeEach, describe, expect, it } from "vitest";
import { clearUser, parseUser, readUser, USER_KEY, writeUser } from "@/features/session/lib/session-storage";

describe("session-storage", () => {
  beforeEach(() => localStorage.clear());

  it("uses the prototype key", () => {
    expect(USER_KEY).toBe("av_user");
  });

  it("returns null when there is no session", () => {
    expect(readUser()).toBeNull();
  });

  it("writes and reads the user with the prototype format", () => {
    writeUser({ name: "KAI" });
    expect(localStorage.getItem("av_user")).toBe('{"name":"KAI"}');
    expect(readUser()).toEqual({ name: "KAI" });
  });

  it("clears the session", () => {
    writeUser({ name: "KAI" });
    clearUser();
    expect(localStorage.getItem("av_user")).toBeNull();
  });

  it("treats corrupt or malformed data as no session", () => {
    localStorage.setItem("av_user", "{oops");
    expect(readUser()).toBeNull();
    localStorage.setItem("av_user", '{"nombre":"KAI"}');
    expect(readUser()).toBeNull();
    expect(parseUser("null")).toBeNull();
  });
});
