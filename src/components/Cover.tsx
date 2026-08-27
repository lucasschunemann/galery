import { useId } from "react";
import type { ArtVariant } from "../data/projects";

/* ============================================================
   Generative project covers. No image files — every cover is an
   SVG composition parameterised by hue, so thumbnails and hero
   art are the same artwork at different sizes.
   ============================================================ */

type Props = { variant: ArtVariant; hue: number; title: string; className?: string };

const hsl = (h: number, s: number, l: number, a = 1) =>
  `hsl(${h} ${s}% ${l}% / ${a})`;

export default function Cover({ variant, hue, title, className }: Props) {
  const uid = useId().replace(/[:]/g, "");
  const id = (n: string) => `${n}-${uid}`;

  const Sky = (
    <>
      <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={hsl(hue, 78, 42)} />
        <stop offset="0.55" stopColor={hsl(hue, 82, 68)} />
        <stop offset="1" stopColor={hsl(hue, 90, 90)} />
      </linearGradient>
      <linearGradient id={id("grass")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="hsl(96 66% 56%)" />
        <stop offset="1" stopColor="hsl(112 58% 26%)" />
      </linearGradient>
      <radialGradient id={id("chrome")} cx="34%" cy="26%">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.28" stopColor="#e8f1f8" />
        <stop offset="0.52" stopColor="#93a9bd" />
        <stop offset="0.74" stopColor="#dfe9f2" />
        <stop offset="1" stopColor="#5c7086" />
      </radialGradient>
    </>
  );

  const clouds = (y = 26, o = 0.85) => (
    <g opacity={o} fill="#fff">
      <ellipse cx="22" cy={y} rx="15" ry="6" />
      <ellipse cx="32" cy={y - 4} rx="11" ry="7" />
      <ellipse cx="44" cy={y} rx="13" ry="5.5" />
      <ellipse cx="74" cy={y + 10} rx="17" ry="6" />
      <ellipse cx="86" cy={y + 6} rx="12" ry="7" />
    </g>
  );

  const body = () => {
    switch (variant) {
      /* --- chrome star on a hill: the album-cover archetype --- */
      case "chromestar":
        return (
          <>
            <rect width="100" height="100" fill={`url(#${id("sky")})`} />
            {clouds(20, 0.7)}
            <path d="M0 78 Q 50 62 100 80 L100 100 L0 100Z" fill={`url(#${id("grass")})`} />
            <g transform="translate(50 52)">
              <path
                d="M0 -40 C 5 -12 12 -6 40 0 C 12 5 6 12 0 40 C -5 12 -12 6 -40 0 C -12 -5 -6 -12 0 -40Z"
                fill={`url(#${id("chrome")})`}
              />
              <path
                d="M0 -26 C 3 -9 8 -4 26 0 C 8 3 4 8 0 26 C -3 8 -8 4 -26 0 C -8 -3 -4 -8 0 -26Z"
                fill="#fff" opacity=".55" transform="rotate(45)"
              />
            </g>
            <g fill="#fff" opacity=".55" fontFamily="monospace" fontSize="2.4">
              {Array.from({ length: 16 }, (_, i) => (
                <text key={i} x="66" y={12 + i * 4}>
                  {["def x(a,b):", "  return a*b", "canvas.draw()", "for i in r(9):", "  p = shape(i)"][i % 5]}
                </text>
              ))}
            </g>
            <rect x="6" y="6" width="42" height="0.7" fill="#fff" opacity=".8" />
          </>
        );

      /* --- rolling hills, clouds, nothing else --- */
      case "bliss":
        return (
          <>
            <rect width="100" height="100" fill={`url(#${id("sky")})`} />
            {clouds(24, 0.9)}
            {clouds(40, 0.4)}
            <path d="M0 72 Q 30 52 62 66 T 100 62 L100 100 L0 100Z" fill={`url(#${id("grass")})`} />
            <path d="M0 84 Q 40 70 100 82 L100 100 L0 100Z" fill="hsl(112 52% 22%)" opacity=".55" />
            <ellipse cx="78" cy="18" rx="9" ry="9" fill="#fff" opacity=".9" />
          </>
        );

      /* --- the XP-era modal on grass --- */
      case "dialog":
        return (
          <>
            <rect width="100" height="100" fill={`url(#${id("sky")})`} />
            {clouds(18, 0.75)}
            <path d="M0 58 Q 50 48 100 58 L100 100 L0 100Z" fill={`url(#${id("grass")})`} />
            <g transform="translate(18 34)">
              <rect x="0" y="0" width="64" height="40" rx="2.5" fill="#e9ecef" stroke="#7d8794" strokeWidth=".7" />
              <rect x="0.8" y="0.8" width="62.4" height="7" rx="2" fill={hsl(hue, 72, 44)} />
              <text x="4" y="6" fontSize="4" fill="#fff" fontFamily="sans-serif">System Warning</text>
              <rect x="6" y="13" width="46" height="2.4" rx="1.2" fill="#9aa4b0" />
              <rect x="6" y="18" width="34" height="2.4" rx="1.2" fill="#b9c2cc" />
              <rect x="16" y="28" width="14" height="7" rx="1.6" fill="#f4f6f8" stroke="#8b95a1" strokeWidth=".6" />
              <rect x="34" y="28" width="14" height="7" rx="1.6" fill="#f4f6f8" stroke="#8b95a1" strokeWidth=".6" />
            </g>
            <path d="M64 66 l0 11 l3-3 l2.4 5 l2.2-1.1 l-2.4-4.8 l4.2-0.4Z" fill="#fff" stroke="#111" strokeWidth=".6" />
          </>
        );

      /* --- oversized display type over hills --- */
      case "typeposter":
        return (
          <>
            <rect width="100" height="100" fill={`url(#${id("sky")})`} />
            {clouds(16, 0.8)}
            <path d="M0 46 Q 34 26 66 44 T 100 40 L100 100 L0 100Z" fill={`url(#${id("grass")})`} />
            <path d="M0 66 Q 44 50 100 66 L100 100 L0 100Z" fill="hsl(120 46% 20%)" opacity=".5" />
            <text
              x="6" y="56" fontSize="21" fontWeight="800" letterSpacing="-1.4"
              fontFamily="Helvetica, Arial, sans-serif" fill="hsl(150 62% 16%)"
            >
              {title.split(" ")[0]?.slice(0, 7).toLowerCase()}
            </text>
            <text
              x="14" y="74" fontSize="21" fontWeight="800" letterSpacing="-1.4"
              fontFamily="Helvetica, Arial, sans-serif" fill="hsl(150 62% 16%)"
            >
              {(title.split(" ")[1] ?? "grass").slice(0, 7).toLowerCase()}
            </text>
            <circle cx="70" cy="49" r="7" fill="#ffd93d" stroke="#1d1d1d" strokeWidth=".8" />
            <circle cx="67.6" cy="47" r="1" fill="#1d1d1d" />
            <circle cx="72.4" cy="47" r="1" fill="#1d1d1d" />
            <path d="M67 51.6 q3 3 6 0" stroke="#1d1d1d" strokeWidth=".9" fill="none" strokeLinecap="round" />
            <g stroke="#fff" strokeOpacity=".35" strokeWidth=".4">
              <path d="M0 12h100M0 24h100M25 0v100M75 0v100" />
            </g>
          </>
        );

      /* --- a single glossy sphere --- */
      case "orb":
        return (
          <>
            <defs>
              <radialGradient id={id("orb")} cx="34%" cy="28%">
                <stop offset="0" stopColor="#fff" />
                <stop offset="0.3" stopColor={hsl(hue, 95, 78)} />
                <stop offset="0.68" stopColor={hsl(hue, 88, 50)} />
                <stop offset="1" stopColor={hsl(hue - 30, 78, 26)} />
              </radialGradient>
              <linearGradient id={id("orbbg")} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor={hsl(hue + 24, 60, 92)} />
                <stop offset="1" stopColor={hsl(hue - 18, 52, 70)} />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#${id("orbbg")})`} />
            <circle cx="50" cy="46" r="30" fill={`url(#${id("orb")})`} />
            <ellipse cx="40" cy="28" rx="16" ry="8.5" fill="#fff" opacity=".8" transform="rotate(-20 40 28)" />
            <ellipse cx="62" cy="62" rx="7" ry="4" fill="#fff" opacity=".35" transform="rotate(-20 62 62)" />
            <ellipse cx="50" cy="84" rx="26" ry="4.5" fill={hsl(hue, 60, 30, 0.28)} />
            <path d="M20 90 Q 50 78 80 90" stroke="#fff" strokeOpacity=".5" fill="none" strokeWidth=".8" />
          </>
        );

      /* --- perspective grid + data waves --- */
      case "gridwave":
        return (
          <>
            <defs>
              <linearGradient id={id("gw")} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={hsl(hue, 70, 18)} />
                <stop offset="1" stopColor={hsl(hue, 78, 40)} />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#${id("gw")})`} />
            <g stroke={hsl(hue + 20, 90, 72)} strokeOpacity=".5" strokeWidth=".4" fill="none">
              {Array.from({ length: 12 }, (_, i) => (
                <path key={i} d={`M${-20 + i * 14} 100 L${38 + i * 2} 46`} />
              ))}
              {Array.from({ length: 8 }, (_, i) => {
                const y = 46 + Math.pow(i, 1.9) * 1.4;
                return <path key={"h" + i} d={`M0 ${y} H100`} />;
              })}
            </g>
            <g fill="none" strokeWidth="1.4" strokeLinecap="round">
              <path d="M4 34 Q 20 14 34 30 T 62 24 T 96 34" stroke={hsl(hue + 40, 100, 78)} />
              <path d="M4 42 Q 22 26 38 38 T 66 32 T 96 40" stroke="#fff" strokeOpacity=".7" />
            </g>
            {[18, 34, 50, 66, 82].map((x, i) => (
              <circle key={i} cx={x} cy={30 + Math.sin(i) * 6} r="1.7" fill="#fff" />
            ))}
          </>
        );

      /* --- lens flare / floating discs --- */
      case "flare":
        return (
          <>
            <defs>
              <radialGradient id={id("fl")} cx="30%" cy="26%">
                <stop offset="0" stopColor="#fff" />
                <stop offset="0.35" stopColor={hsl(hue, 92, 72)} />
                <stop offset="1" stopColor={hsl(hue + 40, 76, 32)} />
              </radialGradient>
              <linearGradient id={id("disc")} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff" />
                <stop offset="0.5" stopColor={hsl(hue + 60, 80, 70)} />
                <stop offset="1" stopColor={hsl(hue, 70, 40)} />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill={`url(#${id("fl")})`} />
            <g opacity=".9">
              <ellipse cx="34" cy="40" rx="19" ry="7" fill={`url(#${id("disc")})`} transform="rotate(-16 34 40)" />
              <ellipse cx="64" cy="30" rx="13" ry="5" fill={`url(#${id("disc")})`} transform="rotate(-24 64 30)" opacity=".85" />
              <ellipse cx="70" cy="58" rx="16" ry="6" fill={`url(#${id("disc")})`} transform="rotate(-8 70 58)" opacity=".8" />
              <circle cx="48" cy="66" r="6" fill="#fff" opacity=".95" />
            </g>
            <g stroke="#fff" strokeOpacity=".8" strokeWidth=".5" fill="none">
              <path d="M0 20 H100M0 82 H100" />
            </g>
            <circle cx="22" cy="20" r="14" fill="#fff" opacity=".25" />
          </>
        );

      /* --- stacked gel lozenges --- */
      case "aquapill":
      default:
        return (
          <>
            <defs>
              <linearGradient id={id("bg2")} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={hsl(hue, 40, 96)} />
                <stop offset="1" stopColor={hsl(hue, 42, 76)} />
              </linearGradient>
              {[0, 1, 2].map((i) => (
                <linearGradient key={i} id={id("pill" + i)} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor={hsl(hue + i * 38, 96, 84)} />
                  <stop offset="0.5" stopColor={hsl(hue + i * 38, 92, 58)} />
                  <stop offset="1" stopColor={hsl(hue + i * 38, 84, 34)} />
                </linearGradient>
              ))}
            </defs>
            <rect width="100" height="100" fill={`url(#${id("bg2")})`} />
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect
                  x={14} y={22 + i * 22} width={72} height={16} rx={8}
                  fill={`url(#${id("pill" + i)})`} stroke={hsl(hue + i * 38, 60, 28, 0.5)} strokeWidth=".5"
                />
                <rect x={18} y={23.4} width={64} height={6} rx={3} fill="#fff" opacity=".75"
                  transform={`translate(0 ${i * 22})`} />
              </g>
            ))}
          </>
        );
    }
  };

  return (
    <svg viewBox="0 0 100 100" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <defs>{Sky}</defs>
      {body()}
    </svg>
  );
}
