import type { LeaderboardRow } from "@/features/games/model/game";
import { formatRank, formatScore } from "@/shared/lib/format";

const podiumClass = (i: number) => (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "");

export type PlayerBest = { name: string; rank: number; score: number };

type Props = {
  rows: LeaderboardRow[];
  gameTitle: string;
  /** Signed-in player's row; omitted when browsing as a guest. */
  you?: PlayerBest;
};

export function HallTable({ rows, gameTitle, you }: Props) {
  return (
    <div className="hall-table">
      <div className="th">
        <div>RANGO</div>
        <div>JUGADOR</div>
        <div>PUNTUACIÓN</div>
        <div>FECHA</div>
      </div>
      {rows.map((r, i) => (
        <div key={r.name + i} className={"tr" + podiumClass(i)} style={{ animationDelay: `${i * 50}ms` }}>
          <div className="rk">#{formatRank(r.rank)}</div>
          <div className="pl">{r.name}</div>
          <div className="sc">{formatScore(r.score)}</div>
          <div className="dt">{r.date}</div>
        </div>
      ))}
      {you && (
        <>
          <div className="tr you-label">▸ TU MEJOR MARCA EN {gameTitle}</div>
          <div className="tr you" style={{ animationDelay: `${rows.length * 50 + 50}ms` }}>
            <div className="rk" style={{ color: "var(--yellow)" }}>#{formatRank(you.rank)}</div>
            <div className="pl" style={{ color: "var(--yellow)" }}>{you.name}</div>
            <div className="sc" style={{ color: "var(--yellow)", textShadow: "0 0 6px rgba(245,255,0,0.5)" }}>{formatScore(you.score)}</div>
            <div className="dt">11/05/2026</div>
          </div>
        </>
      )}
    </div>
  );
}
