import { useState } from "react";
import { useOS, type Flavour } from "../os/store";
import { useSfx } from "../os/useSfx";
import Flag, { type FlagName } from "../components/Flag";

const RAMP = ["--n-0", "--n-5", "--n-10", "--n-15", "--n-20", "--n-30", "--n-40", "--n-60", "--n-80", "--n-95"];
const ACCENTS = ["--accent-dim", "--accent", "--accent-soft"];
const TRICOLOUR = ["--accent", "--accent-2", "--accent-3"];
const FLAVOURS: Flavour[] = ["braun", "zurich", "graphite", "brasil", "holanda", "alemanha", "nino"];
const ORIGIN: string[] = ["brasil", "holanda", "alemanha"];
/** every theme that carries three colours instead of one — the flag
    themes plus Nino, which is tricolour without being tied to a place */
const TRIPLE: string[] = [...ORIGIN, "nino"];

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

  const sheet = [...RAMP, ...ACCENTS, ...(TRIPLE.includes(flavour) ? ["--accent-2", "--accent-3"] : [])]
    .map((v) => `  ${v}: ${read(v)};`)
    .join("\n");

  return (
    <div className="pane tokens">
      <header className="pane__head">
        <p className="t-label">Sistema</p>
        <h1 className="t-h">Tokens</h1>
        <p className="t-body">
          Cada tema tem uma rampa neutra de dez passos e um acento. As superfícies
          se separam por uma linha de 1px, sem sombra.
        </p>
      </header>

      <section className="tok__block">
        <p className="t-label">Tema</p>
        <div className="tok__flavours">
          {FLAVOURS.map((f) => (
            <button
              key={f}
              className="tok__flav"
              data-on={flavour === f}
              onClick={() => { setFlavour(f); sfx("chime"); }}
            >
              {ORIGIN.includes(f) ? (
                <Flag name={f as FlagName} className="tok__flag" />
              ) : (
                <span className="tok__flavswatch" data-flavour={f} aria-hidden>
                  <i /><i /><i />
                </span>
              )}
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

      {TRIPLE.includes(flavour) && (
        <section className="tok__block">
          <p className="t-label">Tricolor</p>
          <p className="t-body">
            Só os temas tricolores têm essa seção: os três tirados de uma
            bandeira, mais o Nino. A primeira cor carrega texto e foco; as
            outras duas são só preenchimento.
          </p>
          <div className="tok__ramp tok__ramp--accent">
            {TRICOLOUR.map((v, i) => (
              <div key={v} className="tok__step">
                <span className="tok__chip" style={{ background: `var(${v})` }} />
                <span className="t-mono">{["primária", "segunda", "terceira"][i]}</span>
              </div>
            ))}
          </div>
        </section>
      )}

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
