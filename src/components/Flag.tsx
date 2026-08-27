/* ============================================================
   Flags for the three themes that come from a place rather than
   from a school. Drawn at the same 20×14 as the two-tone chips
   the other themes use, and simplified until they still read at
   that size: bands where bands are the whole idea, and for
   Brazil the green field with its yellow lozenge.
   ============================================================ */

export type FlagName = "brasil" | "holanda" | "alemanha";

export default function Flag({ name, className }: { name: FlagName; className?: string }) {
  return (
    <svg viewBox="0 0 20 14" width="20" height="14" className={className} aria-hidden>
      {name === "brasil" && (
        <>
          <rect width="20" height="14" fill="#009C3B" />
          <path d="M10 2.2 17.4 7 10 11.8 2.6 7Z" fill="#FFDF00" />
          <circle cx="10" cy="7" r="2.5" fill="#002776" />
        </>
      )}
      {name === "holanda" && (
        <>
          <rect width="20" height="14" fill="#FFFFFF" />
          <rect width="20" height="4.67" fill="#AE1C28" />
          <rect y="9.33" width="20" height="4.67" fill="#21468B" />
        </>
      )}
      {name === "alemanha" && (
        <>
          <rect width="20" height="4.67" fill="#000000" />
          <rect y="4.67" width="20" height="4.67" fill="#DD0000" />
          <rect y="9.33" width="20" height="4.67" fill="#FFCE00" />
        </>
      )}
      <rect width="20" height="14" fill="none" stroke="currentColor" strokeOpacity=".22" />
    </svg>
  );
}
