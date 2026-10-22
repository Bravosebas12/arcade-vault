import type { LeaderboardRow } from "@/features/games/model/game";
import { formatRank, formatScore } from "@/shared/lib/format";

const podiumClass = (i: number) => (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "");

export function Leaderboard({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="leaderboard">
      <h3>MEJORES PUNTUACIONES</h3>
      {rows.map((r, i) => (
        <div key={r.name} className={"lb-row" + podiumClass(i)}>
          <div className="rk">#{formatRank(r.rank)}</div>
          <div className="pl">
            {r.name}
            <div style={{ fontSize: 10, color: "var(--ink-faint)", letterSpacing: "0.1em" }}>{r.date}</div>
          </div>
          <div className="sc">{formatScore(r.score)}</div>
        </div>
      ))}
    </div>
  );
}
