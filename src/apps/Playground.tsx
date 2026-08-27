import { useMemo, useState } from "react";
import { useSfx } from "../os/useSfx";

/* A live material lab: the same parameters that generate the OS's own
   gel buttons, exposed as sliders with the resulting CSS printed below. */

const P = [
  { key: "hue", label: "Matiz", min: 0, max: 360, step: 1, def: 206, unit: "°" },
  { key: "sat", label: "Saturação", min: 20, max: 100, step: 1, def: 88, unit: "%" },
  { key: "radius", label: "Raio", min: 4, max: 40, step: 1, def: 40, unit: "px" },
  { key: "gloss", label: "Brilho especular", min: 0, max: 100, step: 1, def: 88, unit: "%" },
  { key: "depth", label: "Profundidade", min: 0, max: 100, step: 1, def: 62, unit: "%" },
] as const;

type Key = (typeof P)[number]["key"];

export default function Playground() {
  const sfx = useSfx();
  const [v, setV] = useState<Record<Key, number>>(
    () => Object.fromEntries(P.map((p) => [p.key, p.def])) as Record<Key, number>
  );
  const [copied, setCopied] = useState(false);

  const css = useMemo(() => {
    const { hue, sat, radius, gloss, depth } = v;
    const hi = `hsl(${hue} ${sat}% ${Math.round(72 + gloss * 0.14)}%)`;
    const mid = `hsl(${hue} ${sat}% 52%)`;
    const lo = `hsl(${hue} ${Math.round(sat * 0.9)}% ${Math.round(38 - depth * 0.18)}%)`;
    return {
      hi, mid, lo,
      style: {
        borderRadius: `${radius}px`,
        backgroundImage: `linear-gradient(to bottom, ${hi}, ${mid} 46%, ${lo})`,
        boxShadow: [
          `inset 0 1px 0 rgba(255,255,255,${(gloss / 100) * 0.95})`,
          `inset 0 -${Math.round(depth * 0.12)}px ${Math.round(depth * 0.22)}px -6px rgba(0,0,0,${(depth / 100) * 0.55})`,
          `0 ${Math.round(2 + depth * 0.06)}px ${Math.round(4 + depth * 0.12)}px rgba(10,40,80,${0.15 + (depth / 100) * 0.25})`,
        ].join(", "),
      } as React.CSSProperties,
      text: `background-image: linear-gradient(to bottom, ${hi}, ${mid} 46%, ${lo});
border-radius: ${radius}px;
box-shadow:
  inset 0 1px 0 rgba(255,255,255,${((gloss / 100) * 0.95).toFixed(2)}),
  inset 0 -${Math.round(depth * 0.12)}px ${Math.round(depth * 0.22)}px -6px rgba(0,0,0,${((depth / 100) * 0.55).toFixed(2)}),
  0 ${Math.round(2 + depth * 0.06)}px ${Math.round(4 + depth * 0.12)}px rgba(10,40,80,${(0.15 + (depth / 100) * 0.25).toFixed(2)});`,
    };
  }, [v]);

  return (
    <div className="lab">
      <header className="lab__head">
        <h1>Laboratório de materiais</h1>
        <p>Os mesmos parâmetros que geram o gel deste sistema. Mexa neles.</p>
      </header>

      <div className="lab__stage">
        <div className="lab__preview" style={css.style}>
          <span className="lab__gloss" style={{ opacity: v.gloss / 100 }} />
          <span className="lab__previewtext">Botão</span>
        </div>
        <div className="lab__shapes">
          <span className="lab__chip" style={{ ...css.style, borderRadius: 999 }} />
          <span className="lab__chip lab__chip--sq" style={css.style} />
          <span className="lab__chip lab__chip--circle" style={{ ...css.style, borderRadius: 999 }} />
        </div>
      </div>

      <div className="lab__controls">
        {P.map((p) => (
          <label key={p.key} className="slider">
            <span className="slider__label">
              {p.label}
              <b>{v[p.key]}{p.unit}</b>
            </span>
            <input
              type="range" min={p.min} max={p.max} step={p.step} value={v[p.key]}
              className="flow__slider"
              onChange={(e) => setV((s) => ({ ...s, [p.key]: +e.target.value }))}
            />
          </label>
        ))}
      </div>

      <div className="lab__code">
        <pre>{css.text}</pre>
        <button
          className="gel btn"
          onClick={() => {
            navigator.clipboard?.writeText(css.text);
            setCopied(true);
            sfx("chime");
            setTimeout(() => setCopied(false), 1600);
          }}
        >
          {copied ? "Copiado ✓" : "Copiar CSS"}
        </button>
      </div>
    </div>
  );
}
