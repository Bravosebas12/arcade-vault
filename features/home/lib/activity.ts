import type { Game } from "@/features/games/model/game";
import type { RecentScore, TopPlayer } from "@/features/home/data/home-content";
import type { ScoreRow } from "@/features/leaderboard/lib/leaderboard-rows";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** Relative time for the ticker, e.g. "hace 2 min"; "ahora" under a minute (and for clock skew). */
export function timeAgo(createdAt: string, now: number): string {
  const elapsed = now - Date.parse(createdAt);
  if (elapsed < MINUTE) return "ahora";
  if (elapsed < HOUR) return `hace ${Math.floor(elapsed / MINUTE)} min`;
  if (elapsed < DAY) return `hace ${Math.floor(elapsed / HOUR)} h`;
  return `hace ${Math.floor(elapsed / DAY)} d`;
}

type GameLabel = Pick<Game, "id" | "title" | "color">;

/** Ticker rows in the received order (newest first), titled and colored by their game. */
export function toRecentScores(rows: readonly ScoreRow[], games: readonly GameLabel[], now: number): RecentScore[] {
  return rows.map((row) => {
    const game = games.find((g) => g.id === row.game_id);
    return {
      player: row.player_name,
      game: game?.title ?? row.game_id,
      score: row.score,
      ago: timeAgo(row.created_at, now),
      color: game?.color ?? "cyan",
    };
  });
}

/** Top players from rows sorted by score desc: one row per name (their best), ranked from 1. */
export function toTopPlayers(rows: readonly ScoreRow[], limit: number): TopPlayer[] {
  const seen = new Set<string>();
  const top: TopPlayer[] = [];
  for (const row of rows) {
    if (top.length === limit) break;
    if (seen.has(row.player_name)) continue;
    seen.add(row.player_name);
    top.push({ rank: top.length + 1, player: row.player_name, score: row.score });
  }
  return top;
}
