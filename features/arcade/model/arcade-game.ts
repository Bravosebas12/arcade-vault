import type { ComponentType } from "react";

export type GameStats = {
  score: number;
  /** null: the game has no lives. */
  lives: number | null;
  level: number;
};

/** Props the container (ArcadePlayer) passes to each game's canvas. */
export type ArcadeCanvasProps = {
  /** The container decides; the canvas freezes its loop and input. */
  paused: boolean;
  /** Changes on "JUGAR DE NUEVO": the canvas starts a new game. */
  runId: number;
  /** Called only when score, lives or level change, never every frame. */
  onStats: (stats: GameStats) => void;
  /** Called once per game, when it ends. */
  onGameOver: (stats: GameStats) => void;
};

export type ArcadeCanvas = ComponentType<ArcadeCanvasProps>;
