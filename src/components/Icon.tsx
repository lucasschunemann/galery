import { useId } from "react";

/* ============================================================
   Hand-drawn Aqua icons. Each is a self-contained SVG whose
   gradient ids are namespaced per instance with useId() — the
   same icon can appear on the desktop and in the dock without
   the two fighting over the same paint servers.
   Traits of the era: saturated fills, a hard specular ellipse in
   the upper-left, a soft contact shadow, generous rounding.
   ============================================================ */

type P = { size?: number };

/** builds an id-scoping helper plus the shared drop shadow */
function useNS() {
  const raw = useId().replace(/:/g, "");
  const id = (n: string) => `${n}-${raw}`;
  const url = (n: string) => `url(#${id(n)})`;
  return { id, url };
}

const Shadow = ({ id }: { id: string }) => (
  <filter id={id} x="-30%" y="-30%" width="160%" height="170%">
    <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#0a2340" floodOpacity="0.42" />
  </filter>
);

export function FinderIcon({ size = 64 }: P) {
  const { id, url } = useNS();
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <defs>
        <Shadow id={id("s")} />
        <linearGradient id={id("a")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe4ff" /><stop offset=".5" stopColor="#48a6f0" />
          <stop offset="1" stopColor="#0d5cb6" />
        </linearGradient>
        <linearGradient id={id("b")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7fc9ff" /><stop offset="1" stopColor="#1f6fc4" />
        </linearGradient>
      </defs>
      <g filter={url("s")}>
        <path d="M10 30a6 6 0 016-6h20l7 8h31a6 6 0 016 6v10H10z" fill={url("b")} />
        <path d="M10 40a6 6 0 016-6h68a6 6 0 016 6v34a6 6 0 01-6 6H16a6 6 0 01-6-6z" fill={url("a")} />
        <path d="M13 42h74v16c-14 7-28 10-40 10s-24-3-34-8z" fill="#fff" opacity=".38" />
      </g>
    </svg>
  );
}

export function AboutIcon({ size = 64 }: P) {
  const { id, url } = useNS();
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <defs>
        <Shadow id={id("s")} />
        <radialGradient id={id("a")} cx="34%" cy="26%">
          <stop offset="0" stopColor="#ffffff" /><stop offset=".38" stopColor="#8fd6ff" />
          <stop offset="1" stopColor="#0b4f9e" />
        </radialGradient>
        <linearGradient id={id("b")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#cfeaff" stopOpacity=".5" />
        </linearGradient>
      </defs>
      <g filter={url("s")}>
        <circle cx="50" cy="50" r="41" fill={url("a")} />
        <circle cx="50" cy="40" r="13" fill={url("b")} />
        <path d="M26 78a24 24 0 0148 0 41 41 0 01-48 0z" fill={url("b")} />
        <ellipse cx="44" cy="26" rx="26" ry="13" fill="#fff" opacity=".6" />
      </g>
    </svg>
  );
}

export function PlaygroundIcon({ size = 64 }: P) {
  const { id, url } = useNS();
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <defs>
        <Shadow id={id("s")} />
        <radialGradient id={id("a")} cx="35%" cy="28%">
          <stop offset="0" stopColor="#fff" stopOpacity=".98" />
          <stop offset=".3" stopColor="#b6f2ff" stopOpacity=".8" />
          <stop offset=".62" stopColor="#ff9ee6" stopOpacity=".55" />
          <stop offset=".85" stopColor="#7ea8ff" stopOpacity=".8" />
          <stop offset="1" stopColor="#2f5fd0" stopOpacity=".95" />
        </radialGradient>
      </defs>
      <g filter={url("s")}>
        <circle cx="50" cy="50" r="41" fill={url("a")} />
        <circle cx="50" cy="50" r="41" fill="none" stroke="#fff" strokeOpacity=".7" />
        <ellipse cx="38" cy="30" rx="17" ry="10" fill="#fff" opacity=".85" transform="rotate(-22 38 30)" />
        <ellipse cx="66" cy="70" rx="9" ry="5" fill="#fff" opacity=".45" transform="rotate(-22 66 70)" />
      </g>
    </svg>
  );
}

export function TerminalIcon({ size = 64 }: P) {
  const { id, url } = useNS();
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <defs>
        <Shadow id={id("s")} />
        <linearGradient id={id("a")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a4f57" /><stop offset="1" stopColor="#0e1116" />
        </linearGradient>
      </defs>
      <g filter={url("s")}>
        <rect x="12" y="16" width="76" height="68" rx="10" fill={url("a")} stroke="#000" strokeOpacity=".5" />
        <rect x="18" y="22" width="64" height="56" rx="6" fill="#04140a" />
        <path d="M26 36l10 8-10 8" fill="none" stroke="#5cff9d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="42" y="50" width="22" height="4" rx="2" fill="#5cff9d" />
        <path d="M18 22h64v14c-12 5-24 7-33 7s-21-3-31-7z" fill="#fff" opacity=".1" />
      </g>
    </svg>
  );
}

export function ContactIcon({ size = 64 }: P) {
  const { id, url } = useNS();
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <defs>
        <Shadow id={id("s")} />
        <linearGradient id={id("a")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset=".5" stopColor="#dbe9f7" />
          <stop offset="1" stopColor="#9db6cd" />
        </linearGradient>
      </defs>
      <g filter={url("s")}>
        <rect x="10" y="24" width="80" height="54" rx="8" fill={url("a")} />
        <path d="M10 32l40 27 40-27" fill="none" stroke="#4b7ba8" strokeWidth="3.5" strokeLinejoin="round" />
        <path d="M12 26h76v12c-14 7-27 10-38 10s-24-3-38-10z" fill="#fff" opacity=".65" />
      </g>
    </svg>
  );
}

export function PlayerIcon({ size = 64 }: P) {
  const { id, url } = useNS();
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <defs>
        <Shadow id={id("s")} />
        <radialGradient id={id("a")} cx="36%" cy="28%">
          <stop offset="0" stopColor="#ffffff" /><stop offset=".38" stopColor="#dbe6ef" />
          <stop offset=".62" stopColor="#8ea5ba" /><stop offset=".8" stopColor="#e6eef5" />
          <stop offset="1" stopColor="#4a5f74" />
        </radialGradient>
        <linearGradient id={id("b")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfe6ff" /><stop offset=".48" stopColor="#3d9ff0" />
          <stop offset="1" stopColor="#0a4b96" />
        </linearGradient>
      </defs>
      <g filter={url("s")}>
        <circle cx="50" cy="50" r="41" fill={url("a")} />
        <circle cx="50" cy="50" r="41" fill="none" stroke="#5c7086" strokeOpacity=".7" />
        <circle cx="50" cy="50" r="9" fill="#f4f8fb" stroke="#8ea5ba" />
        <ellipse cx="38" cy="26" rx="21" ry="10" fill="#fff" opacity=".72" transform="rotate(-22 38 26)" />
        <g transform="translate(2 -2)">
          <path
            d="M46 26l26-6v34a10 9 0 11-6-8V32l-14 3v30a10 9 0 11-6-8z"
            fill={url("b")} stroke="#08315f" strokeOpacity=".55"
          />
          <path d="M48 28l22-5v5l-22 5z" fill="#fff" opacity=".5" />
        </g>
      </g>
    </svg>
  );
}

export function TrashIcon({ size = 64, full = false }: P & { full?: boolean }) {
  const { id, url } = useNS();
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <defs>
        <Shadow id={id("s")} />
        <linearGradient id={id("a")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7f8b96" /><stop offset=".18" stopColor="#e7edf2" />
          <stop offset=".45" stopColor="#aab6c1" /><stop offset=".72" stopColor="#eef3f7" />
          <stop offset="1" stopColor="#77838e" />
        </linearGradient>
      </defs>
      <g filter={url("s")}>
        <path d="M28 32h44l-5 50a6 6 0 01-6 5H39a6 6 0 01-6-5z" fill={url("a")} stroke="#5c6772" />
        <ellipse cx="50" cy="32" rx="22" ry="6" fill="#dfe6ec" stroke="#5c6772" />
        <g stroke="#8c98a3" strokeOpacity=".85">
          <path d="M40 40v42M50 40v42M60 40v42" />
        </g>
        {full && <path d="M36 30c6-10 10-14 16-16s12 2 14 10z" fill="#8fd6ff" opacity=".9" />}
      </g>
    </svg>
  );
}

export function ProjectIcon({ size = 64 }: P) {
  const { id, url } = useNS();
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden>
      <defs>
        <Shadow id={id("s")} />
        <linearGradient id={id("a")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#d3e2f0" />
        </linearGradient>
      </defs>
      <g filter={url("s")}>
        <path d="M22 12h40l18 18v56a6 6 0 01-6 6H22a6 6 0 01-6-6V18a6 6 0 016-6z" fill={url("a")} stroke="#89a4bd" />
        <path d="M62 12l18 18H68a6 6 0 01-6-6z" fill="#b7cfe4" stroke="#89a4bd" />
        <g fill="#4f9be0" opacity=".75">
          <rect x="26" y="46" width="46" height="5" rx="2.5" />
          <rect x="26" y="58" width="38" height="5" rx="2.5" />
          <rect x="26" y="70" width="42" height="5" rx="2.5" />
        </g>
      </g>
    </svg>
  );
}

export const ICONS = {
  finder: FinderIcon,
  about: AboutIcon,
  playground: PlaygroundIcon,
  terminal: TerminalIcon,
  contact: ContactIcon,
  player: PlayerIcon,
  trash: TrashIcon,
  project: ProjectIcon,
} as const;

export type IconName = keyof typeof ICONS;

export function AppIcon({ name, size = 64 }: { name: IconName; size?: number }) {
  const C = ICONS[name] ?? ProjectIcon;
  return <C size={size} />;
}
