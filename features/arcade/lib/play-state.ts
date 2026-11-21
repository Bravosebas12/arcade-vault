import type { GameStats } from "@/features/arcade/model/arcade-game";

export type ArcadePlayState = {
  /** Last stats received from the canvas. */
  stats: GameStats;
  paused: boolean;
  over: boolean;
  saved: boolean;
  runId: number;
};

export type ArcadePlayAction =
  | { type: "stats"; stats: GameStats }
  | { type: "togglePause" }
  /** Notified by the canvas. */
  | { type: "gameOver"; stats: GameStats }
  /** FIN button. */
  | { type: "end" }
  | { type: "saved" }
  /** Increments runId. */
  | { type: "restart" };

/** lives is null until the canvas notifies its initial stats. */
export const initialArcadePlayState: ArcadePlayState = {
  stats: { score: 0, lives: null, level: 1 },
  paused: false,
  over: false,
  saved: false,
  runId: 0,
};

export function arcadePlayReducer(state: ArcadePlayState, action: ArcadePlayAction): ArcadePlayState {
  switch (action.type) {
    case "stats":
      // Once over, the modal keeps the score it opened with.
      return state.over ? state : { ...state, stats: action.stats };
    case "togglePause":
      return state.over ? state : { ...state, paused: !state.paused };
    case "gameOver":
      return state.over ? state : { ...state, over: true, stats: action.stats };
    case "end":
      return state.over ? state : { ...state, over: true };
    case "saved":
      return { ...state, saved: true };
    case "restart":
      return { ...initialArcadePlayState, runId: state.runId + 1 };
  }
}
