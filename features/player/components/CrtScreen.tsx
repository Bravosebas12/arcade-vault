import type { CSSProperties, ReactNode } from "react";

type Props = {
  title: string;
  paused: boolean;
  /** A real game; when present it replaces the fake arena. */
  children?: ReactNode;
  /** Extra inline style for the CRT frame (real games size it to fit the viewport). */
  frameStyle?: CSSProperties;
  /** Extra inline style for the screen (real games set their canvas proportion). */
  screenStyle?: CSSProperties;
};

// When the CRT itself is narrow (phones, or a tall real game such as Caída on desktop) the footer
// wraps into centered lines with room between them instead of crowding; wide CRTs keep the
// prototype layout. It is a container query on .crt, so it follows the CRT width, not the viewport.
// Class names must stay literal so Tailwind can find them.
const BOTTOM_NARROW = "@max-[560px]:flex-wrap @max-[560px]:justify-center @max-[560px]:gap-x-3 @max-[560px]:gap-y-1.5 @max-[560px]:leading-[1.6]";
const BOTTOM_ITEM_NARROW = "@max-[560px]:whitespace-nowrap";

/** CRT frame; shows the fake animated arena unless a real game is passed as children. */
export function CrtScreen({ title, paused, children, frameStyle, screenStyle }: Props) {
  return (
    <div className="crt @container" style={frameStyle}>
      <div className="crt-screen" style={screenStyle}>
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
      <div className={"crt-bottom " + BOTTOM_NARROW}>
        <span className={"led " + BOTTOM_ITEM_NARROW}>SEÑAL OK</span>
        <span className={BOTTOM_ITEM_NARROW}>{title} · CRT-83 · 60 HZ</span>
        <span className={BOTTOM_ITEM_NARROW}>CARGA · 1MB</span>
      </div>
    </div>
  );
}
