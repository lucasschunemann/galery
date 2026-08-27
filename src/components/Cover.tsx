import { useId } from "react";

/* ============================================================
   Project covers.

   Flat, constructed, on a grid — the vocabulary of Crouwel and
   the Ulm school rather than anything hand-drawn. Colour comes
   from the theme, so covers re-tint with the system. `accent`
   sets how loudly each one speaks; the variety across the grid
   is the point, not variety inside any single cover.
   ============================================================ */

export type ArtVariant =
  | "arcs" | "modular" | "wedge" | "bars"
  | "split" | "numeral" | "orbit" | "mesh";

type Props = {
  variant: ArtVariant;
  index: number;
  title: string;
  accent?: 0 | 1 | 2;
  className?: string;
};

/* the composition lives on a 10-unit grid inside the safe band,
   because a square viewBox is slice-cropped into a 4:5 card */
const L = 22;   // left edge of the safe band
const R = 78;   // right edge
const W = R - L;

export default function Cover({ variant, index, accent = 1, className }: Props) {
  const raw = useId().replace(/:/g, "");
  const id = (n: string) => `${n}-${raw}`;

  const loud = accent === 2;
  const bg = loud ? "var(--accent)" : "var(--n-15)";
  const ink = loud ? "var(--n-0)" : "var(--n-80)";
  const sig = loud ? "var(--n-0)" : "var(--accent)";
  const q = accent === 0 ? 0.45 : 1;

  const body = () => {
    switch (variant) {
      /* quarter arcs in geometric progression */
      case "arcs":
        return (
          <>
            <g fill="none" stroke={ink} opacity={0.3 * q}>
              {[14, 24, 36, 50].map((r, i) => (
                <path key={i} d={`M${L + r} 74 A ${r} ${r} 0 0 0 ${L} ${74 - r}`} strokeWidth={1 + i * 0.5} />
              ))}
            </g>
            <path d={`M${L + 40} 74 A 40 40 0 0 0 ${L} 34`} fill="none" stroke={sig} strokeWidth="3" />
          </>
        );

      /* a module grid with three cells set */
      case "modular": {
        const c = W / 4;
        const on = new Set(["1-1", "0-3", "2-0"]);
        return (
          <g>
            {[0, 1, 2, 3].map((row) =>
              [0, 1, 2, 3].map((col) => {
                const set = on.has(`${row}-${col}`);
                return (
                  <rect
                    key={`${row}${col}`}
                    x={L + col * c} y={26 + row * c}
                    width={c - 2} height={c - 2}
                    fill={set ? sig : ink}
                    opacity={set ? 1 : 0.14 * q}
                  />
                );
              })
            )}
          </g>
        );
      }

      /* a fan of rules, one struck */
      case "wedge":
        return (
          <g stroke={ink}>
            {Array.from({ length: 11 }, (_, i) => {
              const x = L + (i / 10) * W;
              const set = i === 7;
              return (
                <path
                  key={i}
                  d={`M${x} 26 L${x} 74`}
                  strokeWidth={set ? 3 : 1}
                  stroke={set ? sig : ink}
                  opacity={set ? 1 : 0.22 * q}
                />
              );
            })}
          </g>
        );

      /* a bar chart read as rhythm */
      case "bars": {
        const seq = [12, 22, 17, 34, 26, 44, 20];
        const bw = W / seq.length;
        return (
          <g>
            {seq.map((v, i) => (
              <rect
                key={i}
                x={L + i * bw} y={72 - v}
                width={bw - 3} height={v}
                fill={i === 5 ? sig : ink}
                opacity={i === 5 ? 1 : 0.2 * q}
              />
            ))}
            <path d={`M${L} 72 H${R}`} stroke={ink} strokeWidth="1" opacity={0.3 * q} />
          </g>
        );
      }

      /* a plane divided, with a disc on the seam */
      case "split":
        return (
          <>
            <path d={`M${L} 62 H${R} V${78} H${L} Z`} fill={ink} opacity={0.12 * q} />
            <path d={`M${L} 62 H${R}`} stroke={sig} strokeWidth="3" />
            <circle cx={L + W * 0.66} cy="42" r="14" fill="none" stroke={ink} strokeWidth="1.4" opacity={0.4 * q} />
            <circle cx={L + W * 0.66} cy="42" r="5" fill={sig} />
          </>
        );

      /* the index, set large */
      case "numeral":
        return (
          <>
            <text
              x={L} y="64"
              fill={ink} opacity={0.9 * q}
              fontFamily="Inter, system-ui, sans-serif"
              fontWeight="600" fontSize="46" letterSpacing="-2.6"
            >
              {String(index + 1).padStart(2, "0")}
            </text>
            <path d={`M${L} 72 H${R}`} stroke={sig} strokeWidth="3" />
          </>
        );

      /* discs in progression along one axis */
      case "orbit": {
        const rs = [2.5, 4, 6, 9];
        let x = L + 2;
        return (
          <g>
            <path d={`M${L} 50 H${R}`} stroke={ink} strokeWidth="1" opacity={0.24 * q} />
            {rs.map((r, i) => {
              const cx = x + r;
              x = cx + r + 5;
              const last = i === rs.length - 1;
              return (
                <circle
                  key={i}
                  cx={cx} cy="50" r={r}
                  fill={last ? sig : "none"}
                  stroke={last ? "none" : ink}
                  strokeWidth="1.4"
                  opacity={last ? 1 : 0.4 * q}
                />
              );
            })}
          </g>
        );
      }

      /* a stack of rules, one displaced */
      case "mesh":
      default:
        return (
          <g stroke={ink}>
            {Array.from({ length: 7 }, (_, i) => {
              const y = 30 + i * 7;
              const set = i === 3;
              return (
                <path
                  key={i}
                  d={`M${L} ${y} H${set ? R : L + W * (0.42 + i * 0.07)}`}
                  strokeWidth={set ? 3 : 1}
                  stroke={set ? sig : ink}
                  opacity={set ? 1 : 0.26 * q}
                />
              );
            })}
          </g>
        );
    }
  };

  return (
    <svg viewBox="0 0 100 100" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="100" height="100" fill={bg} id={id("bg")} />
      {body()}
    </svg>
  );
}
