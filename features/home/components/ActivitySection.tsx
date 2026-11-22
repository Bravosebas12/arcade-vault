import Link from "next/link";
import { Suspense } from "react";
import { GAMES } from "@/features/games/data/catalog";
import { RECENT_SCORES_LIMIT, TOP_PLAYERS_LIMIT } from "@/features/home/data/home-content";
import { toRecentScores, toTopPlayers } from "@/features/home/lib/activity";
import { getScores } from "@/features/leaderboard/lib/get-leaderboard";
import { formatRank, formatScore } from "@/shared/lib/format";

const topClass = (i: number) => (i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : "");

/** Highest rows read to find the top players: a name may hold several of them. */
const TOP_ROWS_READ = 50;

function EmptyActivity() {
  return (
    <div style={{ textAlign: "center", fontFamily: "var(--pixel)", fontSize: 10, lineHeight: 1.8, color: "var(--yellow)", padding: "24px 16px" }}>
      SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA
    </div>
  );
}

/** Reads the newest scores and stamps their relative time at request time (after connection()). */
async function loadRecentScores() {
  const rows = await getScores("recent", RECENT_SCORES_LIMIT);
  return rows ? toRecentScores(rows, GAMES, Date.now()) : [];
}

/** Newest scores of every real game (server only, request time). */
async function RecentScoresList() {
  const scores = await loadRecentScores();
  if (scores.length === 0) return <EmptyActivity />;
  return scores.map((r, i) => (
    <div key={i} className="tick-row" style={{ animationDelay: (i * 60) + "ms" }}>
      <span className={"tk-p neon-" + r.color}>{r.player}</span>
      <span className="tk-mid">▸ {r.game}</span>
      <span className="tk-s">+{formatScore(r.score)}</span>
      <span className="tk-t">{r.ago}</span>
    </div>
  ));
}

/** Best score per player across every real game (server only, request time). */
async function TopPlayersList() {
  const rows = await getScores("top", TOP_ROWS_READ);
  const players = rows ? toTopPlayers(rows, TOP_PLAYERS_LIMIT) : [];
  if (players.length === 0) return <EmptyActivity />;
  return players.map((r, i) => (
    <div key={r.rank} className={"top-row" + topClass(i)}>
      <span className="tp-rk">#{formatRank(r.rank)}</span>
      <span className="tp-bar"><span className="tp-fill" style={{ width: (100 - i * 16) + "%" }}></span></span>
      <span className="tp-p">{r.player}</span>
      <span className="tp-s">{formatScore(r.score)}</span>
    </div>
  ));
}

/**
 * "ACTIVIDAD EN VIVO": real scores from Supabase, streamed inside <Suspense> so the rest of the Home
 * stays prerendered. Without scores (or without Supabase) each list invites the first player.
 */
export function ActivitySection() {
  return (
    <section className="home-section reveal">
      <div className="section-head">
        <div className="kicker pixel neon-yellow">{"// 03"}</div>
        <h2 className="section-title">ACTIVIDAD EN VIVO</h2>
        <div className="section-rule"></div>
      </div>
      <div className="activity-grid">
        <div className="activity-card">
          <div className="ac-head">
            <div className="ac-title pixel">▸ ÚLTIMAS PUNTUACIONES</div>
          </div>
          <div className="ticker">
            <Suspense fallback={null}>
              <RecentScoresList />
            </Suspense>
          </div>
        </div>

        <div className="activity-card">
          <div className="ac-head">
            <div className="ac-title pixel neon-magenta">▸ TOP JUGADORES</div>
            <Link className="lb-link" style={{ textAlign: "center" }} href="/salon">VER SALÓN →</Link>
          </div>
          <div className="top-list">
            <Suspense fallback={null}>
              <TopPlayersList />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
