import type { LeaderboardRow } from "@/features/games/model/game";
import { formatScore } from "@/shared/lib/format";

/** Top three: silver, gold (center), bronze. Expects at least three rows. */
export function Podium({ rows }: { rows: LeaderboardRow[] }) {
  const [first, second, third] = rows;
  return (
    <div className="podium">
      <div className="podium-slot silver">
        <div className="rank-num">02</div>
        <div className="name">{second.name}</div>
        <div className="score">{formatScore(second.score)}</div>
        <div className="date">{second.date}</div>
      </div>
      <div className="podium-slot gold">
        <div className="pixel" style={{ fontSize: 9, color: "var(--gold)", letterSpacing: "0.18em" }}>CAMPEÓN</div>
        <div className="rank-num" style={{ fontSize: 36, marginTop: 4 }}>01</div>
        <div className="name">{first.name}</div>
        <div className="score" style={{ fontSize: 20 }}>{formatScore(first.score)}</div>
        <div className="date">{first.date}</div>
      </div>
      <div className="podium-slot bronze">
        <div className="rank-num">03</div>
        <div className="name">{third.name}</div>
        <div className="score">{formatScore(third.score)}</div>
        <div className="date">{third.date}</div>
      </div>
    </div>
  );
}
