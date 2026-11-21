import type { GameStats } from "@/features/arcade/model/arcade-game";

export type ArcadePlayState = {
  /** Last stats received from the canvas. */
  stats: GameStats;
  paused: boolean;
  /**
   * Natural game over notified by the canvas, modal not shown yet: the game stays stopped
   * while the canvas shows its own "GAME OVER" text, then revealGameOver opens the modal.
   */
  gameOverPending: boolean;
  /** The save-score modal is open. */
  over: boolean;
  saved: boolean;
  runId: number;
};

export type ArcadePlayAction =
  | { type: "stats"; stats: GameStats }
  | { type: "togglePause" }
  /** Notified by the canvas: stops the game and delays the modal. */
  | { type: "gameOver"; stats: GameStats }
  /** End of the game over delay: opens the modal. */
  | { type: "revealGameOver" }
  /** FIN button: opens the modal right away (also during the game over delay). */
  | { type: "end" }
  | { type: "saved" }
  /** Increments runId. */
  | { type: "restart" };

/** lives is null until the canvas notifies its initial stats. */
export const initialArcadePlayState: ArcadePlayState = {
  stats: { score: 0, lives: null, level: 1 },
  paused: false,
  gameOverPending: false,
  over: false,
  saved: false,
  runId: 0,
};

/** The game no longer runs: game over pending or modal open. */
export const isStopped = (state: ArcadePlayState) => state.over || state.gameOverPending;

export function arcadePlayReducer(state: ArcadePlayState, action: ArcadePlayAction): ArcadePlayState {
  switch (action.type) {
    case "stats":
      // Once the game has ended, the modal keeps the final score.
      return isStopped(state) ? state : { ...state, stats: action.stats };
    case "togglePause":
      return isStopped(state) ? state : { ...state, paused: !state.paused };
    case "gameOver":
      return isStopped(state) ? state : { ...state, gameOverPending: true, stats: action.stats };
    case "revealGameOver":
      return state.gameOverPending ? { ...state, gameOverPending: false, over: true } : state;
    case "end":
      return state.over ? state : { ...state, gameOverPending: false, over: true };
    case "saved":
      return { ...state, saved: true };
    case "restart":
      return { ...initialArcadePlayState, runId: state.runId + 1 };
  }
}
