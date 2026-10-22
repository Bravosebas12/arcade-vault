type Props = {
  onRetry: () => void;
};

/** Terminal shown when the message could not be sent: the success terminal's look, in magenta. */
export function TerminalError({ onRetry }: Props) {
  return (
    <div className="terminal-success" style={{ borderColor: "var(--magenta)", boxShadow: "0 0 22px rgba(255,0,110,0.25)" }}>
      <div className="term-bar">
        <span className="dot r"></span><span className="dot y"></span><span className="dot g"></span>
        <span className="term-title">VAULT-OS // TERMINAL</span>
      </div>
      <div className="term-body">
        <div className="line"><span className="prompt">vault@arcade:~$</span> ./send_message --to=team</div>
        <div className="line dim">[OK] Conectando con servidor…</div>
        <div className="line dim">[ERR] No se pudo transmitir el paquete.</div>
        <div
          className="line"
          style={{ marginTop: 12, color: "var(--magenta)", textShadow: "0 0 6px rgba(255,0,110,0.45)", fontWeight: 700, whiteSpace: "pre-wrap" }}
        >
          &gt; ERROR AL ENVIAR. INTÉNTALO DE NUEVO EN UNOS MINUTOS.<span className="caret">_</span>
        </div>
        <div style={{ marginTop: 18 }}>
          <button className="btn ghost" type="button" onClick={onRetry}>REINTENTAR</button>
        </div>
      </div>
    </div>
  );
}
