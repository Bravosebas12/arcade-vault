"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import type { Game } from "@/features/games/model/game";
import { CrtScreen } from "@/features/player/components/CrtScreen";
import { GameOverModal } from "@/features/player/components/GameOverModal";
import { Hud } from "@/features/player/components/Hud";
import { appendScore } from "@/features/player/lib/score-storage";
import { useSession } from "@/features/session/SessionProvider";

type PlayState = { score: number; lives: number; level: number; paused: boolean; over: boolean; saved: boolean };
type PlayAction = { type: "tick"; points: number } | { type: "togglePause" } | { type: "end" } | { type: "saved" } | { type: "restart" };

const initialState: PlayState = { score: 0, lives: 3, level: 1, paused: false, over: false, saved: false };

function playReducer(state: PlayState, action: PlayAction): PlayState {
  switch (action.type) {
    case "tick": {
      const score = state.score + action.points;
      // Same level-up rule as the prototype: once per score change landing in the first 100 of a 2500 block.
      const levelUp = score > 0 && score % 2500 < 100;
      return { ...state, score, level: levelUp ? state.level + 1 : state.level };
    }
    case "togglePause":
      return { ...state, paused: !state.paused };
    case "end":
      return { ...state, over: true };
    case "saved":
      return { ...state, saved: true };
    case "restart":
      return initialState;
  }
}

export function PlayerScreen({ game }: { game: Game }) {
  const router = useRouter();
  const { user } = useSession();
  const [state, dispatch] = useReducer(playReducer, initialState);
  // null until the player edits it, so the default follows the session once it hydrates.
  const [editedName, setEditedName] = useState<string | null>(null);
  const name = editedName ?? (user ? user.name : "INVITADO");

  // Fake score counter: no real game runs.
  useEffect(() => {
    if (state.over || state.paused) return;
    const t = setInterval(() => dispatch({ type: "tick", points: Math.floor(10 + Math.random() * 90) }), 220);
    return () => clearInterval(t);
  }, [state.over, state.paused]);

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
    appendScore({ game: game.id, score: state.score, name });
    dispatch({ type: "saved" });
  };

  return (
    <div className="av-player fade-in">
      <Hud
        name={name}
        score={state.score}
        lives={state.lives}
        level={state.level}
        paused={state.paused}
        onTogglePause={() => dispatch({ type: "togglePause" })}
        onEnd={() => dispatch({ type: "end" })}
        onExit={() => leaveTo(`/juegos/${game.id}`)}
      />

      <CrtScreen title={game.title} paused={state.paused} />

      {state.over && (
        <GameOverModal
          score={state.score}
          name={name}
          saved={state.saved}
          onNameChange={(value) => setEditedName(value.toUpperCase().slice(0, 10))}
          onSave={save}
          onRestart={restart}
          onBackToVault={() => leaveTo("/")}
        />
      )}
    </div>
  );
}
