"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { hallSeed, seededScores } from "@/features/games/lib/seeded-scores";
import type { LeaderboardRow } from "@/features/games/model/game";
import { HallTable } from "@/features/hall-of-fame/components/HallTable";
import { Podium } from "@/features/hall-of-fame/components/Podium";
import { toPlayerBest } from "@/features/hall-of-fame/lib/player-best";
import { bestLocalScore, SCORES_KEY } from "@/features/player/lib/score-storage";
import { readRaw } from "@/shared/lib/safe-storage";

export const HALL_LEADERBOARD_SIZE = 12;

/** One tab per real game. rows: real top 12, [] when empty, null → seeded rows (Supabase unavailable). */
export type HallTab = { id: string; title: string; rows: LeaderboardRow[] | null };

// av_scores is read through useSyncExternalStore with a null server snapshot, so "TU MEJOR"
// only appears after mount; the raw string snapshot stays referentially stable.
function subscribeScores(listener: () => void) {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
const readScoresRaw = () => readRaw(SCORES_KEY);
const getServerScores = () => null;

export function HallOfFameScreen({ tabs }: { tabs: HallTab[] }) {
  const [tab, setTab] = useState(tabs[0]?.id);
  const active = tabs.find((t) => t.id === tab) ?? tabs[0];
  const rows = useMemo(
    () => (active ? (active.rows ?? seededScores(hallSeed(active.id), HALL_LEADERBOARD_SIZE)) : []),
    [active],
  );

  const scoresRaw = useSyncExternalStore(subscribeScores, readScoresRaw, getServerScores);
  const you = useMemo(() => {
    const best = scoresRaw !== null && active ? bestLocalScore(active.id) : null;
    return best ? toPlayerBest(best, rows, HALL_LEADERBOARD_SIZE) : undefined;
  }, [scoresRaw, active, rows]);

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="pixel" style={{ fontSize: 10 }}>LOS NOMBRES QUE NUNCA SE BORRAN DE LA PANTALLA</p>
      </div>

      <div className="hall-tabs">
        {tabs.map((g) => (
          <button key={g.id} className={"chip" + (active?.id === g.id ? " active" : "")} onClick={() => setTab(g.id)}>
            {g.title}
          </button>
        ))}
      </div>

      {rows.length > 0 && <Podium rows={rows} />}
      <HallTable rows={rows} gameTitle={active?.title ?? ""} you={you} />

      <div style={{ textAlign: "center", marginTop: 32 }}>
        <Link className="btn lg" href="/biblioteca">VOLVER A LA BIBLIOTECA</Link>
      </div>
    </div>
  );
}
