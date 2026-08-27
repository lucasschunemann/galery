import type { ArtVariant } from "../components/Cover";

export interface Project {
  id: string;
  title: string;
  kind: string;
  tagline: string;
  body: string[];
  role: string;
  stack: string[];
  art: ArtVariant;
  /** how loudly the cover speaks: 0 quiet, 1 normal, 2 accent-dominant */
  accent: 0 | 1 | 2;
  metrics: { label: string; value: string }[];
}

/* ============================================================
   Placeholders, on purpose.

   The covers and the layout are finished; the cases are not.
   Each entry below is a slot with the shape of a case study, so
   the gallery can be shown and read without anything here
   claiming to be work that exists.

   To fill one in: replace title, kind, tagline and body, put real
   numbers in metrics, and leave `art` and `accent` alone unless
   you want to change the rhythm of the grid.
   ============================================================ */

const slot = (
  n: number,
  kind: string,
  art: ArtVariant,
  accent: 0 | 1 | 2
): Project => ({
  id: `projeto-${String(n).padStart(2, "0")}`,
  title: `Projeto ${String(n).padStart(2, "0")}`,
  kind,
  tagline: "Espaço reservado para um estudo de caso.",
  body: [
    "Aqui entra o contexto: qual era o problema, para quem, e qual restrição definiu o projeto.",
    "Em seguida, o processo e a decisão. O que foi testado, o que foi descartado e o que mudou no resultado.",
  ],
  role: "A definir",
  stack: ["A definir"],
  art,
  accent,
  metrics: [
    { label: "Métrica", value: "—" },
    { label: "Métrica", value: "—" },
    { label: "Métrica", value: "—" },
  ],
});

export const PROJECTS: Project[] = [
  slot(1, "Interface", "arcs", 1),
  slot(2, "Web", "mesh", 0),
  slot(3, "Interface", "modular", 2),
  slot(4, "Web", "numeral", 0),
  slot(5, "Produto", "orbit", 1),
  slot(6, "Motion", "wedge", 1),
  slot(7, "Web", "split", 2),
  slot(8, "Produto", "bars", 1),
];

export const byId = (id: string) => PROJECTS.find((p) => p.id === id);
export type { ArtVariant };
