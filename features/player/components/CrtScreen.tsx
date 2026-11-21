import type { CSSProperties, ReactNode } from "react";

type Props = {
  title: string;
  paused: boolean;
  /** A real game; when present it replaces the fake arena. */
  children?: ReactNode;
  /** Extra inline style for the CRT frame (real games size it to fit the viewport). */
  frameStyle?: CSSProperties;
};

// Below the player's mobile breakpoint (720px, as .av-player in globals.css) the footer wraps
// into centered lines with room between them instead of overlapping; desktop keeps the prototype.
const BOTTOM_MOBILE = "max-[720px]:flex-wrap max-[720px]:justify-center max-[720px]:gap-x-3 max-[720px]:gap-y-1.5 max-[720px]:leading-[1.6]";
const BOTTOM_ITEM_MOBILE = "max-[720px]:whitespace-nowrap";

/** CRT frame; shows the fake animated arena unless a real game is passed as children. */
export function CrtScreen({ title, paused, children, frameStyle }: Props) {
  return (
    <div className="crt" style={frameStyle}>
      <div className="crt-screen">
        {children ?? (
          <div className="game-arena">
            <div className="grid-floor"></div>
            <div className="enemy e1"></div>
            <div className="enemy e2"></div>
            <div className="enemy e3"></div>
            <div className="player-ship"></div>
          </div>
        )}
        {paused && (
          <div className="crt-content" style={{ background: "rgba(0,0,0,0.6)", zIndex: 5 }}>
            <div>
              <div className="pixel neon-yellow" style={{ fontSize: 22 }}>EN PAUSA</div>
              <div className="mono" style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 10, letterSpacing: "0.16em" }}>PULSA REANUDAR PARA CONTINUAR</div>
            </div>
          </div>
        )}
      </div>
      <div className={"crt-bottom " + BOTTOM_MOBILE}>
        <span className={"led " + BOTTOM_ITEM_MOBILE}>SEÑAL OK</span>
        <span className={BOTTOM_ITEM_MOBILE}>{title} · CRT-83 · 60 HZ</span>
        <span className={BOTTOM_ITEM_MOBILE}>CARGA · 1MB</span>
      </div>
    </div>
  );
}
