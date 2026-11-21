// Player name rules shared by the client and the Server Action.
// Mirrors the check on public.scores.player_name and submit_score.

export const PLAYER_NAME_MAX = 10;

const DEFAULT_PLAYER_NAME = "INVITADO";

/** Trims the input; blank becomes "INVITADO". Never changes case or characters. */
export function toPlayerName(input: string): string {
  const name = input.trim();
  return name === "" ? DEFAULT_PLAYER_NAME : name;
}

/** 1–10 characters (code points, like Postgres char_length) and no surrounding spaces. */
export function isValidPlayerName(name: string): boolean {
  const length = Array.from(name).length;
  return length >= 1 && length <= PLAYER_NAME_MAX && name === name.trim();
}
