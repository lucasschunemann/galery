import { useState } from "react";
import { useOS, type Flavour } from "../os/store";
import { useSfx } from "../os/useSfx";

const RAMP = ["--n-0", "--n-5", "--n-10", "--n-15", "--n-20", "--n-30", "--n-40", "--n-60", "--n-80", "--n-95"];
const ACCENTS = ["--accent-dim", "--accent", "--accent-soft"];
const FLAVOURS: Flavour[] = ["matcha", "sakura", "yozora", "sumi", "washi"];

/* The system's own token sheet, live. Changing anything here
   changes the OS you are looking at — including this window. */
export default function Tokens() {
  const { setFlavour, toggleGrain, toggleSound } = useOS();
  const flavour = useOS((s) => s.flavour);
  const grain = useOS((s) => s.grain);
  const sound = useOS((s) => s.sound);
  const sfx = useSfx();
  const [copied, setCopied] = useState(false);

  const read = (v: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(v).trim() || "—";

  const sheet = [...RAMP, ...ACCENTS].map((v) => `  ${v}: ${read(v)};`).join("\n");

  return (
    <div className="pane tokens">
      <header className="pane__head">
        <p className="t-label">Sistema · tokens</p>
        <h1 className="t-h">Paleta tonal</h1>
        <p className="t-body">
          Elevação é expressa por tom, nunca por sombra. Um acento por paleta,
          e o resto é uma rampa neutra de dez passos.
        </p>
      </header>

      <section className="tok__block">
        <p className="t-label">Paleta ativa</p>
        <div className="tok__flavours">
          {FLAVOURS.map((f) => (
            <button
              key={f}
              className="tok__flav"
              data-on={flavour === f}
              onClick={() => { setFlavour(f); sfx("chime"); }}
            >
              <span className="tok__flavswatch" data-flavour={f} aria-hidden>
                <i /><i /><i />
              </span>
              {f}
            </button>
          ))}
        </div>
      </section>

      <section className="tok__block">
        <p className="t-label">Neutros</p>
        <div className="tok__ramp">
          {RAMP.map((v) => (
            <div key={v} className="tok__step">
              <span className="tok__chip" style={{ background: `var(${v})` }} />
              <span className="t-mono">{v.replace("--n-", "")}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tok__block">
        <p className="t-label">Acento</p>
        <div className="tok__ramp tok__ramp--accent">
          {ACCENTS.map((v) => (
            <div key={v} className="tok__step">
              <span className="tok__chip" style={{ background: `var(${v})` }} />
              <span className="t-mono">{v.replace("--accent", "").replace("-", "") || "base"}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="tok__block">
        <p className="t-label">Sistema</p>
        <div className="tok__toggles">
          <button className="tok__toggle" data-on={grain} onClick={() => { toggleGrain(); sfx("click"); }}>
            <span className="tok__led" aria-hidden />grão de filme
          </button>
          <button className="tok__toggle" data-on={sound} onClick={() => { toggleSound(); sfx("click"); }}>
            <span className="tok__led" aria-hidden />som da interface
          </button>
        </div>
      </section>

      <section className="tok__block">
        <p className="t-label">Saída</p>
        <pre className="tok__code">{`:root {\n${sheet}\n}`}</pre>
        <button
          className="btn btn--accent"
          onClick={() => {
            navigator.clipboard?.writeText(`:root {\n${sheet}\n}`);
            setCopied(true);
            sfx("chime");
            setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? "copiado ✓" : "copiar tokens"}
        </button>
      </section>
    </div>
  );
}
