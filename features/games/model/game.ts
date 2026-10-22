export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type CategoryFilter = "TODOS" | GameCategory;

export type Game = {
  /** Slug used in the URL, e.g. "bloque-buster". */
  id: string;
  title: string;
  /** Card description. */
  short: string;
  /** Detail screen description. */
  long: string;
  cat: GameCategory;
  /** CSS class that draws the cover, e.g. "cover-bricks". */
  cover: `cover-${string}`;
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
};

export type LeaderboardRow = {
  /** 1-based, after sorting by score descending. */
  rank: number;
  name: string;
  score: number;
  /** "dd/mm/2026" */
  date: string;
};
