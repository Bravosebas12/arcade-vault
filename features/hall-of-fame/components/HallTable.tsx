import type { LeaderboardRow } from "@/features/games/model/game";
import type { PlayerBest } from "@/features/hall-of-fame/lib/player-best";
import { formatRank, formatScore } from "@/shared/lib/format";

const podiumClass = (i: number) => (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "");

type Props = {
  rows: LeaderboardRow[];
  gameTitle: string;
  /** This browser's best local score; omitted when there is none. */
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
      {rows.length === 0 && (
        <div
          className="tr"
          style={{ gridTemplateColumns: "1fr", textAlign: "center", fontFamily: "var(--pixel)", fontSize: 11, lineHeight: 1.8, color: "var(--yellow)", padding: "32px 18px" }}
        >
          SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA
        </div>
      )}
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
            <div className="rk" style={{ color: "var(--yellow)" }}>#{you.rank === null ? "--" : formatRank(you.rank)}</div>
            <div className="pl" style={{ color: "var(--yellow)" }}>{you.name}</div>
            <div className="sc" style={{ color: "var(--yellow)", textShadow: "0 0 6px rgba(245,255,0,0.5)" }}>{formatScore(you.score)}</div>
            <div className="dt">{you.date}</div>
          </div>
        </>
      )}
    </div>
  );
}
