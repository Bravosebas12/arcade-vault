"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { GAMES } from "@/features/games/data/catalog";
import { hallSeed, seededScores } from "@/features/games/lib/seeded-scores";
import { HallTable, type PlayerBest } from "@/features/hall-of-fame/components/HallTable";
import { Podium } from "@/features/hall-of-fame/components/Podium";
import { useSession } from "@/features/session/SessionProvider";

export function HallOfFameScreen() {
  const { user } = useSession();
  const [tab, setTab] = useState(GAMES[0].id);
  const rows = useMemo(() => seededScores(hallSeed(tab), 12), [tab]);
  const game = GAMES.find((g) => g.id === tab) ?? GAMES[0];

  // Fake "your best" row, derived exactly as in the prototype.
  const you: PlayerBest | undefined = user
    ? { name: user.name, rank: Math.floor(8 + (tab.length % 4)), score: rows[5].score - 2400 || 9999 }
    : undefined;

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA</p>
      </div>

      <div className="hall-tabs">
        {GAMES.map((g) => (
          <button key={g.id} className={"chip" + (tab === g.id ? " active" : "")} onClick={() => setTab(g.id)}>
            {g.title}
          </button>
        ))}
      </div>

      <Podium rows={rows} />
      <HallTable rows={rows} gameTitle={game.title} you={you} />

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link className="btn lg" href="/">VOLVER A LA BIBLIOTECA</Link>
      </div>
    </div>
  );
}
