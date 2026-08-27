import { useId } from "react";

/* ============================================================
   Project covers.

   Same idea as before — colour comes from the OS palette so every
   cover re-tints with the room — but the drawing is soft now:
   round caps, generous negative space, gradients instead of flat
   fills. Rhythm across the grid comes from `accent`: 0 is a
   whisper, 2 speaks.
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

export default function Cover({ variant, index, accent = 1, className }: Props) {
  const raw = useId().replace(/:/g, "");
  const id = (n: string) => `${n}-${raw}`;
  const url = (n: string) => `url(#${id(n)})`;

  const loud = accent === 2;
  const ink = loud ? "var(--n-0)" : "var(--n-80)";
  const sig = loud ? "var(--n-0)" : "var(--accent)";
  const quiet = accent === 0 ? 0.4 : 1;

  const cap = { strokeLinecap: "round", strokeLinejoin: "round", fill: "none" } as const;

  const body = () => {
    switch (variant) {
      case "arcs":
        return (
          <>
            <g stroke={ink} opacity={0.26 * quiet} {...cap}>
              {[20, 34, 48, 62].map((r, i) => (
                <path
                  key={i}
                  d={`M ${22 + r} 80 A ${r} ${r} 0 0 0 22 ${80 - r}`}
                  strokeWidth={2 + i * 0.7}
                />
              ))}
            </g>
            <path d="M63 80 A 41 41 0 0 0 22 39" stroke={sig} strokeWidth="4.5" {...cap} />
            <circle cx="22" cy="39" r="5" fill={sig} />
          </>
        );

      case "modular":
        return (
          <g>
            {[0, 1, 2].map((r) =>
              [0, 1, 2].map((c) => {
                const on = (r === 1 && c === 1) || (r === 0 && c === 2);
                return (
                  <rect
                    key={`${r}${c}`}
                    x={20 + c * 21} y={20 + r * 21}
                    width="17" height="17" rx="6"
                    fill={on ? sig : ink}
                    opacity={on ? 1 : 0.16 * quiet}
                  />
                );
              })
            )}
          </g>
        );

      case "wedge":
        return (
          <>
            <g stroke={ink} opacity={0.26 * quiet} {...cap}>
              {Array.from({ length: 9 }, (_, i) => {
                const a = (-52 + (i / 8) * 104) * (Math.PI / 180);
                return (
                  <path
                    key={i}
                    d={`M50 84 L${50 + Math.sin(a) * 56} ${84 - Math.cos(a) * 56}`}
                    strokeWidth="3"
                  />
                );
              })}
            </g>
            <path d="M50 84 L50 24" stroke={sig} strokeWidth="4.5" {...cap} />
            <circle cx="50" cy="84" r="5" fill={sig} />
          </>
        );

      case "bars": {
        const seq = [16, 30, 22, 48, 34, 26, 14];
        return (
          <g>
            {seq.map((v, i) => (
              <rect
                key={i}
                x={19 + i * 9.4} y={74 - v}
                width="6" height={v} rx="3"
                fill={i === 3 ? sig : ink}
                opacity={i === 3 ? 1 : 0.24 * quiet}
              />
            ))}
          </g>
        );
      }

      case "split":
        return (
          <>
            <defs>
              <linearGradient id={id("sp")} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={ink} stopOpacity={0.16 * quiet} />
                <stop offset="1" stopColor={ink} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M-4 66 C 24 44, 58 78, 104 46 L104 104 L-4 104Z" fill={url("sp")} />
            <path d="M-4 66 C 24 44, 58 78, 104 46" stroke={sig} strokeWidth="4" {...cap} />
            <circle cx="66" cy="34" r="13" stroke={ink} strokeWidth="2.4" opacity={0.4 * quiet} {...cap} />
          </>
        );

      case "numeral":
        return (
          <>
            <text
              x="50" y="72" textAnchor="middle"
              fill={ink} opacity={0.85 * quiet}
              fontFamily='"M PLUS Rounded 1c", system-ui, sans-serif'
              fontWeight="800" fontSize="62" letterSpacing="-3"
            >
              {String(index + 1).padStart(2, "0")}
            </text>
            <path d="M30 84 H70" stroke={sig} strokeWidth="4" {...cap} />
          </>
        );

      case "orbit": {
        const rs = [2.5, 4, 6, 8.5];
        let x = 24;
        return (
          <g>
            {rs.map((r, i) => {
              const cx = x + r;
              x = cx + r + 4;
              const last = i === rs.length - 1;
              return (
                <circle
                  key={i}
                  cx={cx} cy="52" r={r}
                  fill={last ? sig : "none"}
                  stroke={last ? "none" : ink}
                  strokeWidth="2.4"
                  opacity={last ? 1 : 0.36 * quiet}
                />
              );
            })}
          </g>
        );
      }

      case "mesh":
      default:
        return (
          <g {...cap}>
            {[0, 1, 2, 3].map((i) => (
              <path
                key={i}
                d={`M8 ${40 + i * 12} C 30 ${26 + i * 12}, 52 ${56 + i * 12}, 92 ${34 + i * 12}`}
                stroke={i === 1 ? sig : ink}
                strokeWidth={i === 1 ? 4 : 2.4}
                opacity={i === 1 ? 1 : 0.3 * quiet}
              />
            ))}
          </g>
        );
    }
  };

  return (
    <svg viewBox="0 0 100 100" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>
        <linearGradient id={id("bg")} x1="0" y1="0" x2="0.6" y2="1">
          {loud ? (
            <>
              <stop offset="0" stopColor="var(--accent-soft)" />
              <stop offset="1" stopColor="var(--accent)" />
            </>
          ) : (
            <>
              <stop offset="0" stopColor="var(--n-15)" />
              <stop offset="1" stopColor="var(--n-5)" />
            </>
          )}
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={url("bg")} />
      {body()}
    </svg>
  );
}
