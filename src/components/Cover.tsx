import { useId } from "react";

/* ============================================================
   Project covers as Swiss compositions.

   Colour comes from the OS palette via CSS variables, so every
   cover re-tints when the flavour changes. Variation across the
   grid comes from composition and tonal weight — never from hue.
   `accent` sets how loudly a cover speaks: 0 is nearly silent,
   2 is accent-dominant. Rhythm across the grid is the point.
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

export default function Cover({ variant, index, title, accent = 1, className }: Props) {
  const raw = useId().replace(/:/g, "");
  const id = (n: string) => `${n}-${raw}`;

  const bg = accent === 2 ? "var(--accent)" : "var(--n-10)";
  const ink = accent === 2 ? "var(--n-0)" : "var(--n-80)";
  const hair = accent === 2 ? "rgba(0,0,0,.28)" : "var(--line-strong)";
  const sig = accent === 2 ? "var(--n-0)" : "var(--accent)";
  const quiet = accent === 0 ? 0.35 : 1;

  const body = () => {
    switch (variant) {
      /* concentric arcs off a corner — the Beethoven move */
      case "arcs":
        return (
          <>
            <g stroke={ink} fill="none" opacity={0.55 * quiet}>
              {Array.from({ length: 9 }, (_, i) => (
                <circle key={i} cx="14" cy="86" r={12 + i * 11} strokeWidth={0.4 + i * 0.34} />
              ))}
            </g>
            <circle cx="14" cy="86" r="45" fill="none" stroke={sig} strokeWidth="1.6" />
            <path d="M8 12h44" stroke={ink} strokeWidth="1" opacity={quiet} />
          </>
        );

      /* modular grid with a few cells struck */
      case "modular": {
        const cells = [3, 6, 9, 12, 17, 22];
        return (
          <>
            <g stroke={hair} strokeWidth="0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <path key={"v" + i} d={`M${16 + i * 17} 8V92`} />
              ))}
              {Array.from({ length: 5 }, (_, i) => (
                <path key={"h" + i} d={`M8 ${16 + i * 17}H92`} />
              ))}
            </g>
            {cells.map((c) => {
              const col = c % 5;
              const row = Math.floor(c / 5);
              return (
                <rect
                  key={c}
                  x={16 + col * 17} y={16 + row * 17}
                  width="17" height="17"
                  fill={c === 9 ? sig : ink}
                  opacity={c === 9 ? 1 : 0.14 * quiet}
                />
              );
            })}
          </>
        );
      }

      /* a fan of rays */
      case "wedge":
        return (
          <>
            <g stroke={ink} opacity={0.5 * quiet}>
              {Array.from({ length: 26 }, (_, i) => {
                const a = (-50 + (i / 25) * 100) * (Math.PI / 180);
                return (
                  <path
                    key={i}
                    d={`M50 96 L${50 + Math.sin(a) * 120} ${96 - Math.cos(a) * 120}`}
                    strokeWidth={i === 13 ? 0 : 0.45}
                  />
                );
              })}
            </g>
            <path d="M50 96 L50 -18" stroke={sig} strokeWidth="1.8" />
            <circle cx="50" cy="96" r="3.4" fill={sig} />
          </>
        );

      /* rhythmic bars — a Musica Viva cadence */
      case "bars": {
        const seq = [14, 26, 20, 46, 32, 62, 40, 24, 12];
        return (
          <>
            <path d="M8 78H92" stroke={hair} strokeWidth="0.6" />
            {seq.map((v, i) => (
              <rect
                key={i}
                x={10 + i * 9.2} y={78 - v}
                width="6" height={v}
                fill={i === 5 ? sig : ink}
                opacity={i === 5 ? 1 : 0.3 * quiet}
              />
            ))}
            <text x="8" y="90" fill={ink} opacity={0.6 * quiet} fontFamily="monospace" fontSize="4.4" letterSpacing="0.6">
              {title.slice(0, 22).toUpperCase()}
            </text>
          </>
        );
      }

      /* a diagonal cut with a disc riding it */
      case "split":
        return (
          <>
            <clipPath id={id("cp")}>
              <path d="M0 0H100V100H0Z" />
            </clipPath>
            <g clipPath={`url(#${id("cp")})`}>
              <path d="M-10 74 L110 26 L110 110 L-10 110Z" fill={ink} opacity={0.12 * quiet} />
              <path d="M-10 74 L110 26" stroke={sig} strokeWidth="1.4" />
              <circle cx="66" cy="42" r="17" fill="none" stroke={ink} strokeWidth="0.8" opacity={quiet} />
              <circle cx="66" cy="42" r="6" fill={sig} />
            </g>
          </>
        );

      /* an oversized cropped numeral */
      case "numeral":
        return (
          <>
            <text
              x="50" y="86" textAnchor="middle"
              fill={ink} opacity={0.9 * quiet}
              fontFamily="Helvetica, Arial, sans-serif"
              fontWeight="700" fontSize="98" letterSpacing="-6"
            >
              {String(index + 1).padStart(2, "0")}
            </text>
            <path d="M8 22H92" stroke={sig} strokeWidth="1.6" />
            <path d="M8 30H52" stroke={ink} strokeWidth="0.6" opacity={quiet} />
          </>
        );

      /* discs in geometric progression along an axis */
      case "orbit": {
        const rs = [3, 4.4, 6.4, 9.4, 13.8, 20.2];
        let x = 12;
        return (
          <>
            <path d="M4 54H96" stroke={hair} strokeWidth="0.5" />
            {rs.map((r, i) => {
              const cx = x + r;
              x = cx + r + 3;
              return (
                <circle
                  key={i}
                  cx={cx} cy="54" r={r}
                  fill={i === rs.length - 1 ? sig : "none"}
                  stroke={i === rs.length - 1 ? "none" : ink}
                  strokeWidth="0.8"
                  opacity={i === rs.length - 1 ? 1 : quiet}
                />
              );
            })}
          </>
        );
      }

      /* a perspective mesh */
      case "mesh":
      default:
        return (
          <>
            <g stroke={ink} fill="none" opacity={0.4 * quiet} strokeWidth="0.5">
              {Array.from({ length: 13 }, (_, i) => (
                <path key={"v" + i} d={`M${-30 + i * 13} 100 L${34 + i * 2.6} 40`} />
              ))}
              {Array.from({ length: 8 }, (_, i) => {
                const y = 40 + Math.pow(i, 1.95) * 1.35;
                return <path key={"h" + i} d={`M0 ${y}H100`} />;
              })}
            </g>
            <path d="M4 30 Q 26 12 48 28 T 96 22" fill="none" stroke={sig} strokeWidth="1.6" />
            <circle cx="48" cy="28" r="2.6" fill={sig} />
          </>
        );
    }
  };

  return (
    <svg viewBox="0 0 100 100" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <rect width="100" height="100" fill={bg} />
      {body()}
      {/* every cover carries its index, printed */}
      <text
        x="92" y="93" textAnchor="end"
        fill={ink} opacity={0.5 * quiet}
        fontFamily="monospace" fontSize="4.6" letterSpacing="0.5"
      >
        {String(index + 1).padStart(2, "0")}
      </text>
    </svg>
  );
}
