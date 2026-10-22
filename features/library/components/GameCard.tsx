"use client";

import { useRef } from "react";
import type { Game } from "@/features/games/model/game";
import { formatScore } from "@/shared/lib/format";

const buttonColor = (color: Game["color"]) => (color === "magenta" ? "magenta" : color === "yellow" ? "yellow" : "");

type Props = {
  game: Game;
  onSelect: (game: Game) => void;
};

export function GameCard({ game, onSelect }: Props) {
  const tiltRef = useRef<HTMLDivElement>(null);

  // Tilt follows the cursor by writing the transform directly, as in the prototype.
  const onMove = (e: React.MouseEvent) => {
    const el = tiltRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
  };
  const onLeave = () => {
    if (tiltRef.current) tiltRef.current.style.transform = "";
  };

  return (
    <div ref={tiltRef} className="card" onMouseMove={onMove} onMouseLeave={onLeave} onClick={() => onSelect(game)}>
      <div className="cover">
        <div className={"cover-bg " + game.cover}></div>
        <div className="label">{game.cat}</div>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
        <div className="row">
          <div className="score-badge">
            <span>MEJOR PUNTUACIÓN</span>
            <b>{formatScore(game.best)}</b>
          </div>
          <button
            className={"btn " + buttonColor(game.color)}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(game);
            }}
          >
            JUGAR
          </button>
        </div>
      </div>
    </div>
  );
}
