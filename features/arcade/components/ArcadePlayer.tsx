"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import { arcadePlayReducer, initialArcadePlayState } from "@/features/arcade/lib/play-state";
import type { ArcadeCanvas, GameStats } from "@/features/arcade/model/arcade-game";
import type { Game } from "@/features/games/model/game";
import { CrtScreen } from "@/features/player/components/CrtScreen";
import { GameOverModal } from "@/features/player/components/GameOverModal";
import { Hud } from "@/features/player/components/Hud";
import { appendScore } from "@/features/player/lib/score-storage";
import { useSession } from "@/features/session/SessionProvider";

type ArcadePlayerProps = { game: Game; Canvas: ArcadeCanvas };

function isTextInput(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
}

/** Player for real games: owns pause, FIN, restart and the save-score modal; the canvas obeys through props. */
export function ArcadePlayer({ game, Canvas }: ArcadePlayerProps) {
  const router = useRouter();
  const { user } = useSession();
  const [state, dispatch] = useReducer(arcadePlayReducer, initialArcadePlayState);
  // null until the player edits it, so the default follows the session once it hydrates.
  const [editedName, setEditedName] = useState<string | null>(null);
  const name = editedName ?? (user ? user.name : "INVITADO");

  // P and Escape toggle the pause while the game is running (no modal).
  useEffect(() => {
    if (state.over) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || isTextInput(e.target)) return;
      if (e.code === "KeyP" || e.code === "Escape") dispatch({ type: "togglePause" });
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.over]);

  const restart = () => {
    dispatch({ type: "restart" });
    setEditedName(null);
  };

  // Cache Components keeps the route state alive after navigating away, so reset before leaving.
  const leaveTo = (href: string) => {
    restart();
    router.push(href);
  };

  const save = () => {
    appendScore({ game: game.id, score: state.stats.score, name });
    dispatch({ type: "saved" });
  };

  return (
    <div className="av-player fade-in">
      <Hud
        name={name}
        score={state.stats.score}
        lives={state.stats.lives}
        level={state.stats.level}
        paused={state.paused}
        onTogglePause={() => dispatch({ type: "togglePause" })}
        onEnd={() => dispatch({ type: "end" })}
        onExit={() => leaveTo(`/juegos/${game.id}`)}
      />

      <CrtScreen title={game.title} paused={state.paused}>
        <Canvas
          paused={state.paused || state.over}
          runId={state.runId}
          onStats={(stats: GameStats) => dispatch({ type: "stats", stats })}
          onGameOver={(stats: GameStats) => dispatch({ type: "gameOver", stats })}
        />
      </CrtScreen>

      {state.over && (
        <GameOverModal
          score={state.stats.score}
          name={name}
          saved={state.saved}
          onNameChange={(value) => setEditedName(value.toUpperCase().slice(0, 10))}
          onSave={save}
          onRestart={restart}
          onBackToVault={() => leaveTo("/biblioteca")}
        />
      )}
    </div>
  );
}
