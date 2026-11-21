"use server";

import { revalidatePath } from "next/cache";
import { toPlayerName } from "@/features/leaderboard/lib/score-input";
import { createClient } from "@/shared/lib/supabase/server";

export type SubmitScoreResult =
  | { status: "saved" }
  | { status: "error"; reason: "unavailable" | "rejected" };

export type SubmitScoreInput = { gameId: string; score: number; name: string };

/** Validation errors raised by public.submit_score (errcode P0001, message = code). */
const REJECTION_CODES: readonly string[] = ["unknown_game", "score_out_of_range", "invalid_name", "too_soon"];

/** Logs only why a save failed: never the player name or the score. */
const logFailure = (reason: string, detail = "") => console.error("[leaderboard] Score not saved:", reason, detail);

/** Sends one score to public.submit_score as the anon role and refreshes the leaderboards that show it. */
export async function submitScore({ gameId, score, name }: SubmitScoreInput): Promise<SubmitScoreResult> {
  const supabase = await createClient();
  if (!supabase) {
    logFailure("Supabase is not configured");
    return { status: "error", reason: "unavailable" };
  }

  try {
    const { error } = await supabase.rpc("submit_score", {
      p_game_id: gameId,
      p_player_name: toPlayerName(name),
      p_score: score,
    });
    if (error) {
      if (error.code === "P0001" && REJECTION_CODES.includes(error.message)) {
        logFailure("submit_score rejected the score", error.message);
        return { status: "error", reason: "rejected" };
      }
      // details/hint may echo the row, so only the code and message are logged.
      logFailure("Supabase returned an error", `${error.code}: ${error.message}`);
      return { status: "error", reason: "unavailable" };
    }
  } catch (e) {
    logFailure("Supabase request threw", e instanceof Error ? `${e.name}: ${e.message}` : "UnknownError");
    return { status: "error", reason: "unavailable" };
  }

  revalidatePath("/salon");
  revalidatePath(`/juegos/${gameId}`);
  return { status: "saved" };
}
