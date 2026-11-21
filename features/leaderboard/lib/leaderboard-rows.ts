import type { Game, LeaderboardRow } from "@/features/games/model/game";
import type { GameRecord } from "@/features/leaderboard/model/game-row";

// Row shapes as PostgREST returns them. They are structurally identical to
// Database["public"]["Tables"]["scores" | "games"]["Row"] (without the private
// scores.user_id column), so the generated types can replace them directly.

export type ScoreRow = {
  id: number;
  game_id: string;
  player_name: string;
  score: number;
  created_at: string;
};

export type GameRow = {
  id: string;
  title: string;
  short_description: string;
  long_description: string;
  category: string;
  cover: string;
  color: string;
  max_score: number;
  sort_order: number;
  created_at: string;
};

/** Formats a timestamptz as "dd/mm/yyyy" in UTC, so server output never depends on the host timezone. */
function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getUTCFullYear()}`;
}

/** Keeps the received order (the query already sorts by score desc, created_at asc). */
export function toLeaderboardRows(rows: readonly ScoreRow[]): LeaderboardRow[] {
  return rows.map((row, index) => ({
    rank: index + 1,
    name: row.player_name,
    score: row.score,
    date: formatDate(row.created_at),
  }));
}

export function toGameRecord(row: GameRow): GameRecord {
  return {
    id: row.id,
    title: row.title,
    short: row.short_description,
    long: row.long_description,
    // The table's check constraints restrict these columns to the Game unions.
    cat: row.category as Game["cat"],
    cover: row.cover as Game["cover"],
    color: row.color as Game["color"],
    maxScore: row.max_score,
    sortOrder: row.sort_order,
  };
}
