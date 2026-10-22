/** One entry of the JSON array stored in localStorage["av_scores"]. */
export type SavedScore = {
  /** Game.id */
  game: string;
  score: number;
  /** Initials, uppercase, max 10 chars. */
  name: string;
  /** Date.now() at save time. */
  at: number;
};
