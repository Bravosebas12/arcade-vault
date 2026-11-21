export type ArcadePalette = { bg: string; ink: string; inkDim: string; cyan: string; magenta: string; yellow: string; green: string; line: string };

/** Fallbacks matching the :root tokens of app/globals.css, used when a token is missing. */
export const DEFAULT_ARCADE_PALETTE: ArcadePalette = {
  bg: "#0a0a0f",
  ink: "#e6e9ff",
  inkDim: "#8a8fb5",
  cyan: "#00f5ff",
  magenta: "#ff006e",
  yellow: "#f5ff00",
  green: "#00ff88",
  line: "rgba(0, 245, 255, 0.18)",
};

const TOKENS: Record<keyof ArcadePalette, string> = {
  bg: "--bg",
  ink: "--ink",
  inkDim: "--ink-dim",
  cyan: "--cyan",
  magenta: "--magenta",
  yellow: "--yellow",
  green: "--green",
  line: "--line",
};

/** Reads the neon palette from the :root tokens. Call it after mounting (in an effect). */
export function readArcadePalette(): ArcadePalette {
  const styles = getComputedStyle(document.documentElement);
  const palette = { ...DEFAULT_ARCADE_PALETTE };
  for (const key of Object.keys(TOKENS) as (keyof ArcadePalette)[]) {
    const value = styles.getPropertyValue(TOKENS[key]).trim();
    if (value) palette[key] = value;
  }
  return palette;
}
