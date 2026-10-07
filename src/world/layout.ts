import { PROJECTS } from "../data/projects";

/* ============================================================
   O mapa da galeria.

   Uma grade 3×3 de ilhas, com o átrio no centro. Os seis
   trabalhos, o Sobre e o Contato ficam no anel de fora, ligados
   em sentido horário; quatro pontes ligam o átrio às ilhas do
   meio de cada lado. A colina fica além do Sobre, no ponto mais
   alto da tela.

   Tudo que se pisa está em y = 0, menos a colina. Isso deixa o
   piso inteiro ser um espelho só.
   ============================================================ */

export type ZoneKind = "atrium" | "work" | "about" | "contact" | "hill";
export type Side = "N" | "S" | "E" | "W";

export interface Zone {
  id: string;
  kind: ZoneKind;
  x: number;
  z: number;
  /** meia largura da ilha quadrada, ou raio da colina */
  half: number;
  label: string;
  short: string;
  color: string;
  project?: number;
  /** centro da escultura */
  focus: { x: number; z: number };
  /** ponto livre por onde as rotas passam */
  hub: { x: number; z: number };
  links: Side[];
}

export const SPACING = 28;
const S = SPACING;
const WORK_HALF = 7.5;
const FOCUS = -3;

const mk = (
  id: string,
  kind: ZoneKind,
  gx: number,
  gz: number,
  label: string,
  short: string,
  color: string,
  project?: number,
): Zone => {
  const x = gx * S;
  const z = gz * S;
  const half = kind === "atrium" ? 10 : kind === "hill" ? 13 : WORK_HALF;
  return {
    id, kind, x, z, half, label, short, color, project,
    focus: kind === "atrium" ? { x: x - 5.2, z: z - 5.2 } : kind === "hill" ? { x, z } : { x: x + FOCUS, z: z + FOCUS },
    hub: kind === "hill" ? { x, z: z + 8.5 } : { x, z },
    links: [],
  };
};

const P = PROJECTS;
const pad = (n: number) => String(n + 1).padStart(2, "0");

export const ZONES: Zone[] = [
  mk("atrio", "atrium", 0, 0, "Átrio", "VON", "#4aa8ff"),
  mk(P[0].id, "work", 0, -1, P[0].title, pad(0), P[0].color, 0),
  mk(P[1].id, "work", 1, -1, P[1].title, pad(1), P[1].color, 1),
  mk(P[2].id, "work", 1, 0, P[2].title, pad(2), P[2].color, 2),
  mk(P[3].id, "work", 1, 1, P[3].title, pad(3), P[3].color, 3),
  mk(P[4].id, "work", 0, 1, P[4].title, pad(4), P[4].color, 4),
  mk(P[5].id, "work", -1, 1, P[5].title, pad(5), P[5].color, 5),
  mk("contato", "contact", -1, 0, "Contato", "@", "#1fb8d6"),
  mk("sobre", "about", -1, -1, "Sobre", "LS", "#9a7bff"),
  mk("colina", "hill", -1, -2.15, "A colina", "∞", "#58c43a"),
];

export const zoneById = (id: string) => ZONES.find((z) => z.id === id);

export const LINKS: [string, string][] = [
  // o anel, em sentido horário a partir do 01
  [P[0].id, P[1].id],
  [P[1].id, P[2].id],
  [P[2].id, P[3].id],
  [P[3].id, P[4].id],
  [P[4].id, P[5].id],
  [P[5].id, "contato"],
  ["contato", "sobre"],
  ["sobre", P[0].id],
  // os raios do átrio
  ["atrio", P[0].id],
  ["atrio", P[2].id],
  ["atrio", P[4].id],
  ["atrio", "contato"],
  // e a saída para a colina
  ["sobre", "colina"],
];

/* ---------------- pontes ---------------- */

export interface Bridge {
  a: Zone;
  b: Zone;
  axis: "x" | "z";
  /** trecho entre as bordas das duas ilhas */
  from: number;
  to: number;
  /** coordenada fixa no outro eixo */
  at: number;
}

export const BRIDGE_WIDTH = 3;

const sideOf = (from: Zone, to: Zone): Side => {
  if (Math.abs(from.x - to.x) > Math.abs(from.z - to.z)) return to.x > from.x ? "E" : "W";
  return to.z > from.z ? "S" : "N";
};

export const BRIDGES: Bridge[] = LINKS.map(([ia, ib]) => {
  const a = zoneById(ia)!;
  const b = zoneById(ib)!;
  a.links.push(sideOf(a, b));
  b.links.push(sideOf(b, a));
  const axis: "x" | "z" = Math.abs(a.x - b.x) > Math.abs(a.z - b.z) ? "x" : "z";
  const [lo, hi] = axis === "x" ? (a.x < b.x ? [a, b] : [b, a]) : a.z < b.z ? [a, b] : [b, a];
  const loEdge = (axis === "x" ? lo.x : lo.z) + lo.half * (lo.kind === "hill" ? 0.86 : 1);
  const hiEdge = (axis === "x" ? hi.x : hi.z) - hi.half * (hi.kind === "hill" ? 0.86 : 1);
  return { a, b, axis, from: loEdge, to: hiEdge, at: axis === "x" ? a.z : a.x };
});

/* ---------------- onde se pode pisar ---------------- */

const MARGIN = 0.8;
const BODY = 0.38;

interface Circle { x: number; z: number; r: number }

export const OBSTACLES: Circle[] = [];
for (const z of ZONES) {
  if (z.kind === "atrium") {
    // o pedestal do VON é uma barra na diagonal; quatro círculos dão conta
    for (let i = -1.5; i <= 1.5; i++) {
      const d = i * 2 * Math.SQRT1_2;
      OBSTACLES.push({ x: z.focus.x + d, z: z.focus.z - d, r: 1.3 });
    }
  } else if (z.kind === "hill") {
    OBSTACLES.push({ x: z.focus.x, z: z.focus.z, r: 1.7 });
  } else {
    OBSTACLES.push({ x: z.focus.x, z: z.focus.z, r: 1.85 });
  }
}

const HILL = ZONES.find((z) => z.kind === "hill")!;
export const HILL_RADIUS = HILL.half;
export const HILL_HEIGHT = 3.4;

/** quem mora atrás da colina */
export const SPOON = { x: HILL.x - 6.6, z: HILL.z - 6.6 };
OBSTACLES.push({ x: SPOON.x, z: SPOON.z, r: 0.9 });

export function groundY(x: number, z: number) {
  const d = Math.hypot(x - HILL.x, z - HILL.z);
  if (d >= HILL_RADIUS) return 0;
  const c = Math.cos((d / HILL_RADIUS) * Math.PI * 0.5);
  return HILL_HEIGHT * c * c;
}

function onFloor(x: number, z: number) {
  for (const zn of ZONES) {
    if (zn.kind === "hill") {
      if (Math.hypot(x - zn.x, z - zn.z) < zn.half - 1.6) return true;
      continue;
    }
    const h = zn.half - MARGIN;
    if (Math.abs(x - zn.x) <= h && Math.abs(z - zn.z) <= h) return true;
  }
  const w = BRIDGE_WIDTH / 2 - 0.45;
  for (const b of BRIDGES) {
    const along = b.axis === "x" ? x : z;
    const across = b.axis === "x" ? z : x;
    if (along >= b.from - 2 && along <= b.to + 2 && Math.abs(across - b.at) <= w) return true;
  }
  return false;
}

export function walkable(x: number, z: number) {
  if (!onFloor(x, z)) return false;
  for (const o of OBSTACLES) {
    if (Math.hypot(x - o.x, z - o.z) < o.r + BODY) return false;
  }
  return true;
}

/** empurra o ponto para fora dos obstáculos, para o corpo deslizar em volta deles */
export function pushOut(p: { x: number; z: number }) {
  for (const o of OBSTACLES) {
    const dx = p.x - o.x;
    const dz = p.z - o.z;
    const d = Math.hypot(dx, dz);
    const min = o.r + BODY;
    if (d < min && d > 1e-4) {
      p.x = o.x + (dx / d) * min;
      p.z = o.z + (dz / d) * min;
    }
  }
}

export function clearLine(ax: number, az: number, bx: number, bz: number) {
  const len = Math.hypot(bx - ax, bz - az);
  const steps = Math.max(1, Math.ceil(len / 0.35));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    if (!walkable(ax + (bx - ax) * t, az + (bz - az) * t)) return false;
  }
  return true;
}

export function zoneAt(x: number, z: number): Zone | undefined {
  for (const zn of ZONES) {
    if (zn.kind === "hill") {
      if (Math.hypot(x - zn.x, z - zn.z) < zn.half) return zn;
    } else if (Math.abs(x - zn.x) <= zn.half && Math.abs(z - zn.z) <= zn.half) return zn;
  }
  return undefined;
}

function nearestZone(x: number, z: number) {
  let best = ZONES[0];
  let bd = Infinity;
  for (const zn of ZONES) {
    const d = Math.hypot(x - zn.hub.x, z - zn.hub.z);
    if (d < bd) { bd = d; best = zn; }
  }
  return best;
}

function neighbours(id: string) {
  const out: string[] = [];
  for (const [a, b] of LINKS) {
    if (a === id) out.push(b);
    else if (b === id) out.push(a);
  }
  return out;
}

/** rota em pontos de passagem, do ponto atual até o destino */
export function route(fx: number, fz: number, tx: number, tz: number) {
  if (clearLine(fx, fz, tx, tz)) return [{ x: tx, z: tz }];
  const za = zoneAt(fx, fz) ?? nearestZone(fx, fz);
  const zb = zoneAt(tx, tz) ?? nearestZone(tx, tz);

  // busca em largura no grafo das ilhas
  const prev = new Map<string, string | null>([[za.id, null]]);
  const queue = [za.id];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === zb.id) break;
    for (const n of neighbours(cur)) {
      if (!prev.has(n)) { prev.set(n, cur); queue.push(n); }
    }
  }
  const chain: string[] = [];
  for (let c: string | null | undefined = zb.id; c; c = prev.get(c)) chain.unshift(c);

  const pts = chain.map((id) => zoneById(id)!.hub);
  pts.push({ x: tx, z: tz });

  // puxa o fio: pula pontos que já se enxergam
  const out: { x: number; z: number }[] = [];
  let cx = fx;
  let cz = fz;
  let i = 0;
  while (i < pts.length) {
    let j = pts.length - 1;
    while (j > i && !clearLine(cx, cz, pts[j].x, pts[j].z)) j--;
    out.push(pts[j]);
    cx = pts[j].x;
    cz = pts[j].z;
    i = j + 1;
  }
  return out;
}

/** onde ficar para olhar uma escultura de frente */
export function standPoint(zn: Zone) {
  if (zn.kind === "hill") return { x: zn.x + 2.6, z: zn.z + 2.6 };
  if (zn.kind === "atrium") return { x: zn.x - 0.5, z: zn.z - 0.5 };
  return { x: zn.focus.x + 2.9, z: zn.focus.z + 2.9 };
}
