import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { submitScore } from "@/features/leaderboard/actions/submit-score";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
  revalidatePath: vi.fn(),
}));

vi.mock("@/shared/lib/supabase/server", () => ({ createClient: mocks.createClient }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

const NAME = "Ñandú_KAI";
const SCORE = 123457;
const input = { gameId: "asteroids", score: SCORE, name: `  ${NAME} ` };

const pgError = (code: string, message: string) => ({ code, message, details: `Failing row contains (${NAME}, ${SCORE})`, hint: "" });

describe("submitScore", () => {
  let logError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mocks.createClient.mockReset();
    mocks.rpc.mockReset();
    mocks.revalidatePath.mockReset();
    mocks.createClient.mockResolvedValue({ rpc: mocks.rpc });
    logError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    const logged = JSON.stringify(logError.mock.calls);
    expect(logged).not.toContain("Ñandú");
    expect(logged).not.toContain(String(SCORE));
    logError.mockRestore();
  });

  it("answers unavailable without a Supabase client", async () => {
    mocks.createClient.mockResolvedValue(null);

    await expect(submitScore(input)).resolves.toEqual({ status: "error", reason: "unavailable" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it.each(["unknown_game", "score_out_of_range", "invalid_name", "too_soon"])(
    "answers rejected when submit_score raises %s",
    async (code) => {
      mocks.rpc.mockResolvedValue({ data: null, error: pgError("P0001", code) });

      await expect(submitScore(input)).resolves.toEqual({ status: "error", reason: "rejected" });
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
      expect(JSON.stringify(logError.mock.calls)).toContain(code);
    },
  );

  it("answers unavailable on a network error returned by the client", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: pgError("", "TypeError: fetch failed") });

    await expect(submitScore(input)).resolves.toEqual({ status: "error", reason: "unavailable" });
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });

  it("answers unavailable when the client throws", async () => {
    mocks.rpc.mockRejectedValue(new TypeError("fetch failed"));

    await expect(submitScore(input)).resolves.toEqual({ status: "error", reason: "unavailable" });
    expect(logError).toHaveBeenCalledTimes(1);
  });

  it("answers unavailable on an unexpected database error, even with code P0001", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: pgError("P0001", "something_else") });

    await expect(submitScore(input)).resolves.toEqual({ status: "error", reason: "unavailable" });
  });

  it("saves the exact trimmed name and score, then revalidates the leaderboards", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    await expect(submitScore(input)).resolves.toEqual({ status: "saved" });
    expect(mocks.rpc).toHaveBeenCalledWith("submit_score", { p_game_id: "asteroids", p_player_name: NAME, p_score: SCORE });
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/salon");
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/juegos/asteroids");
    expect(logError).not.toHaveBeenCalled();
  });

  it("sends INVITADO for a blank name", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    await submitScore({ ...input, name: "   " });
    expect(mocks.rpc).toHaveBeenCalledWith("submit_score", { p_game_id: "asteroids", p_player_name: "INVITADO", p_score: SCORE });
  });
});
