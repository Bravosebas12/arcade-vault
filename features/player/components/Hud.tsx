import { formatRank, formatScore } from "@/shared/lib/format";

type Props = {
  name: string;
  score: number;
  lives: number;
  level: number;
  paused: boolean;
  onTogglePause: () => void;
  onEnd: () => void;
  onExit: () => void;
};

export function Hud({ name, score, lives, level, paused, onTogglePause, onEnd, onExit }: Props) {
  return (
    <div className="player-hud">
      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div className="hud-stat"><div className="l">Jugador</div><div className="v" style={{ color: "var(--ink)" }}>{name}</div></div>
        <div className="hud-stat"><div className="l">Puntuación</div><div className="v">{formatScore(score)}</div></div>
        <div className="hud-stat lives"><div className="l">Vidas</div><div className="v">{"♥ ".repeat(lives).trim() || "—"}</div></div>
        <div className="hud-stat level"><div className="l">Nivel</div><div className="v">{formatRank(level)}</div></div>
      </div>
      <div className="hud-actions">
        <button className="btn yellow" onClick={onTogglePause}>{paused ? "REANUDAR" : "PAUSA"}</button>
        <button className="btn magenta" onClick={onEnd}>FIN</button>
        <button className="btn ghost" onClick={onExit}>SALIR</button>
      </div>
    </div>
  );
}
