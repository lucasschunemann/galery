/* ============================================================
   PICTOGRAMS

   One system, drawn the Ulm way: every mark sits on the same
   24-unit grid, uses the same 1.5 stroke, and is built from
   circles, squares and 45° diagonals only. Nothing is drawn by
   eye — if a shape cannot be described by the grid, it does not
   belong in the set.
   ============================================================ */

export type PictName =
  | "work" | "about" | "tokens" | "terminal" | "contact"
  | "player" | "archive" | "project" | "search" | "lock"
  | "tile" | "float" | "close" | "grid";

const P: Record<PictName, React.ReactNode> = {
  /* a gallery: one field divided */
  work: (
    <>
      <rect x="3.75" y="4.75" width="16.5" height="14.5" />
      <path d="M3.75 12.5h16.5M12 4.75v14.5" />
    </>
  ),
  /* the Aicher figure, reduced to head and shoulders */
  about: (
    <>
      <circle cx="12" cy="8.5" r="3.25" />
      <path d="M5.5 19.25a6.5 6.5 0 0113 0" />
    </>
  ),
  /* a tonal ramp in three steps */
  tokens: (
    <>
      <rect x="3.75" y="4.75" width="16.5" height="14.5" />
      <path d="M9.25 4.75v14.5M14.75 4.75v14.5" />
      <path d="M3.75 19.25h5.5v-14.5" fill="currentColor" stroke="none" opacity=".9" />
    </>
  ),
  /* prompt and rule */
  terminal: (
    <>
      <rect x="3.75" y="4.75" width="16.5" height="14.5" />
      <path d="M7.5 9.5l3 2.5-3 2.5M12.75 15h4" />
    </>
  ),
  /* envelope: a rectangle and one fold */
  contact: (
    <>
      <rect x="3.75" y="5.75" width="16.5" height="12.5" />
      <path d="M3.75 7.5L12 13.25l8.25-5.75" />
    </>
  ),
  /* concentric: a disc */
  player: (
    <>
      <circle cx="12" cy="12" r="8.25" />
      <circle cx="12" cy="12" r="2.25" />
    </>
  ),
  /* a box with its lid */
  archive: (
    <>
      <rect x="3.75" y="4.75" width="16.5" height="4" />
      <path d="M5.5 8.75v10.5h13V8.75M9.75 12.5h4.5" />
    </>
  ),
  /* a sheet with a folded corner */
  project: (
    <>
      <path d="M5.25 3.75h8.5l5 5v11.5h-13.5z" />
      <path d="M13.75 3.75v5h5" />
    </>
  ),
  search: (
    <>
      <circle cx="10.75" cy="10.75" r="6" />
      <path d="M15.25 15.25l4.5 4.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5.25" y="10.5" width="13.5" height="9" />
      <path d="M8.5 10.5V7.75a3.5 3.5 0 017 0v2.75" />
    </>
  ),
  /* the tiling layout: master and stack */
  tile: (
    <>
      <rect x="3.75" y="4.75" width="16.5" height="14.5" />
      <path d="M13.5 4.75v14.5M13.5 12h6.75" />
    </>
  ),
  /* one plane lifted off another */
  float: (
    <>
      <path d="M3.75 8.75h11.5v10.5H3.75z" />
      <path d="M8.75 8.75v-4h11.5v10.5h-5" />
    </>
  ),
  close: <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />,
  /* the modular grid itself */
  grid: (
    <>
      <path d="M3.75 9.25h16.5M3.75 14.75h16.5M9.25 3.75v16.5M14.75 3.75v16.5" />
    </>
  ),
};

export default function Pict({
  name,
  size = 18,
  className,
}: {
  name: PictName;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden
    >
      {P[name]}
    </svg>
  );
}
