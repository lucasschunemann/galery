import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RingGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector3,
} from "three";
import { BRIDGES, BRIDGE_WIDTH, HILL_RADIUS, ZONES, groundY, type Zone } from "./layout";
import { M, anodized, standard } from "./materials";
import { archWall, bridgeArch, onLayer, shadowed, type Opening } from "./geo";
import { paintGlow, paintSign, signSpec } from "./sign";
import { rng } from "./env";

/* ============================================================
   A arquitetura: ilhas brancas sobre pirâmides invertidas,
   muros com arcos nos fundos de cada sala, pontes em arco, e
   um piso só, contínuo, que espelha o que está em cima dele.
   ============================================================ */

export const BELOW = 1; // camada que o espelho não enxerga

export interface Sign {
  group: Group;
  base: number;
  phase: number;
  /** o halo que acende à noite */
  glow: MeshBasicMaterial;
}

export interface Built {
  root: Group;
  signs: Sign[];
  rings: Map<string, { ring: Mesh; mat: MeshBasicMaterial }>;
  /** onde fica a etiqueta HTML de cada zona */
  anchors: Map<string, Vector3>;
}

const WALL_H = 5.2;
const WALL_D = 0.7;

export function buildArchitecture(): Built {
  const root = new Group();
  const signs: Sign[] = [];
  const rings = new Map<string, { ring: Mesh; mat: MeshBasicMaterial }>();
  const anchors = new Map<string, Vector3>();
  const floorRects: [number, number, number, number][] = [];

  for (const zn of ZONES) {
    const r = rng(zn.id.length * 97 + Math.round(zn.x * 3 + zn.z * 7));
    if (zn.kind === "hill") {
      root.add(hill(zn));
    } else {
      root.add(base(zn, r));
      floorRects.push([zn.x - zn.half, zn.x + zn.half, zn.z - zn.half, zn.z + zn.half]);
      if (zn.kind !== "atrium") root.add(walls(zn));
      else root.add(atriumColumns(zn));
    }

    if (zn.kind !== "atrium" && zn.kind !== "hill") {
      const p = pedestal(zn);
      root.add(p.group);
      rings.set(zn.id, { ring: p.ring, mat: p.mat });
    }

    const s = sign(zn);
    root.add(s.group);
    signs.push(s);

    const ay = zn.kind === "hill" ? groundY(zn.focus.x, zn.focus.z) + 6.6 : zn.kind === "atrium" ? 5.6 : 4.7;
    anchors.set(zn.id, new Vector3(zn.focus.x, ay, zn.focus.z));
  }

  for (const b of BRIDGES) {
    const len = b.to - b.from;
    const mid = (b.from + b.to) / 2;
    const m = new Mesh(bridgeArch(len, BRIDGE_WIDTH, 2.6), M.white);
    if (b.axis === "x") m.position.set(mid, -0.02, b.at);
    else {
      m.position.set(b.at, -0.02, mid);
      m.rotation.y = Math.PI / 2;
    }
    root.add(onLayer(shadowed(m, false, true), BELOW));
    const w = BRIDGE_WIDTH / 2;
    floorRects.push(
      b.axis === "x"
        ? [b.from - 0.01, b.to + 0.01, b.at - w, b.at + w]
        : [b.at - w, b.at + w, b.from - 0.01, b.to + 0.01],
    );
  }

  const floor = new Mesh(floorGeometry(floorRects), M.floor);
  floor.receiveShadow = true;
  root.add(onLayer(floor, BELOW));

  return { root, signs, rings, anchors };
}

/* ---------------- o piso, num desenho só ---------------- */

function floorGeometry(rects: [number, number, number, number][]) {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  rects.forEach(([x0, x1, z0, z1], i) => {
    pos.push(x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z1);
    nor.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0);
    const o = i * 4;
    idx.push(o, o + 2, o + 1, o, o + 3, o + 2);
  });
  const g = new BufferGeometry();
  g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute("normal", new BufferAttribute(new Float32Array(nor), 3));
  g.setIndex(idx);
  return g;
}

/* ---------------- a base da ilha ---------------- */

function base(zn: Zone, r: () => number) {
  const g = new Group();
  const H = zn.half;
  const slab = new Mesh(new BoxGeometry(H * 2, 1.4, H * 2), M.white);
  slab.position.set(zn.x, -0.72, zn.z);
  g.add(slab);

  // às vezes um bloco intermediário, para as ilhas não serem gêmeas
  let top = -1.42;
  if (r() > 0.4) {
    const k = 0.55 + r() * 0.2;
    const h = 1.6 + r() * 2.2;
    const blk = new Mesh(new BoxGeometry(H * 2 * k, h, H * 2 * k), M.trunk);
    blk.position.set(zn.x, top - h / 2, zn.z);
    g.add(blk);
    top -= h;
  }
  const depth = 11 + r() * 6;
  const pyr = new Mesh(new CylinderGeometry(H * 0.86 * Math.SQRT2, 0.25, depth, 4, 1), M.trunk);
  pyr.rotation.y = Math.PI / 4;
  pyr.position.set(zn.x, top - depth / 2, zn.z);
  g.add(pyr);

  return onLayer(shadowed(g, false, true), BELOW);
}

/* ---------------- os muros do fundo ---------------- */

function openingsFor(H: number, door: boolean): Opening[] {
  if (door) {
    return [
      { at: 0, w: 3.3, h: 4.1 },
      { at: -H * 0.62, w: 1.2, h: 2.1, y: 1.7 },
      { at: H * 0.62, w: 1.2, h: 2.1, y: 1.7 },
    ];
  }
  return [
    { at: -H * 0.4, w: 1.9, h: 3.4, y: 0.9 },
    { at: H * 0.4, w: 1.9, h: 3.4, y: 0.9 },
  ];
}

function walls(zn: Zone) {
  const g = new Group();
  const H = zn.half;
  const len = H * 2;

  const north = new Mesh(archWall(len, WALL_H, WALL_D, openingsFor(H, zn.links.includes("N"))), M.white);
  north.position.set(zn.x, 0, zn.z - H + WALL_D / 2);
  g.add(north);

  const west = new Mesh(archWall(len, WALL_H, WALL_D, openingsFor(H, zn.links.includes("W"))), M.white);
  west.position.set(zn.x - H + WALL_D / 2, 0, zn.z);
  west.rotation.y = Math.PI / 2;
  g.add(west);

  // cornija: uma régua que sobra um pouco, para a luz desenhar a borda
  const capN = new Mesh(new BoxGeometry(len + 0.3, 0.28, WALL_D + 0.3), M.white);
  capN.position.set(zn.x + 0.15, WALL_H + 0.14, zn.z - H + WALL_D / 2);
  const capW = new Mesh(new BoxGeometry(WALL_D + 0.3, 0.28, len + 0.3), M.white);
  capW.position.set(zn.x - H + WALL_D / 2, WALL_H + 0.14, zn.z + 0.15);
  g.add(capN, capW);

  // e uma esfera cromada no canto, como um remate
  const orb = new Mesh(new SphereGeometry(0.55, 28, 18), M.chrome);
  orb.position.set(zn.x - H + WALL_D / 2, WALL_H + 0.85, zn.z - H + WALL_D / 2);
  g.add(orb);

  return shadowed(g);
}

function atriumColumns(zn: Zone) {
  const g = new Group();
  const H = zn.half - 1.1;
  const corners: [number, number][] = [[-H, -H], [H, -H], [-H, H]];
  for (const [cx, cz] of corners) {
    const col = new Mesh(new BoxGeometry(1, 6.2, 1), M.white);
    col.position.set(zn.x + cx, 3.1, zn.z + cz);
    const cap = new Mesh(new BoxGeometry(1.4, 0.3, 1.4), M.white);
    cap.position.set(zn.x + cx, 6.35, zn.z + cz);
    const orb = new Mesh(new SphereGeometry(0.62, 28, 18), M.chrome);
    orb.position.set(zn.x + cx, 7.15, zn.z + cz);
    g.add(col, cap, orb);
  }
  return shadowed(g);
}

/* ---------------- pedestal e o anel de chegada ---------------- */

function pedestal(zn: Zone) {
  const g = new Group();
  const ped = new Mesh(new CylinderGeometry(1.72, 1.85, 0.9, 44), M.white);
  ped.position.set(zn.focus.x, 0.45, zn.focus.z);
  const band = new Mesh(new TorusGeometry(1.73, 0.07, 8, 56), anodized(zn.color, 0.25));
  band.rotation.x = Math.PI / 2;
  band.position.set(zn.focus.x, 0.9, zn.focus.z);
  g.add(shadowed(ped), band);

  const mat = new MeshBasicMaterial({ color: new Color(zn.color), transparent: true, opacity: 0.35, depthWrite: false });
  const ring = new Mesh(new RingGeometry(2.55, 2.72, 72), mat);
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(zn.focus.x, 0.015, zn.focus.z);
  ring.renderOrder = 2;
  g.add(onLayer(ring, BELOW));
  return { group: g, ring, mat };
}

/* ---------------- letreiros ---------------- */

const glowTex = paintGlow();

function sign(zn: Zone): Sign {
  const g = new Group();
  const spec = signSpec(zn);
  const tex = paintSign(spec);
  const big = zn.kind === "atrium" ? 1.3 : 1;
  const w = 5.2 * big;
  const h = w * (124 / 200);
  const frame = new Mesh(new BoxGeometry(w + 0.36, h + 0.36, 0.28), M.porcelain);
  const screen = new Mesh(new PlaneGeometry(w, h), new MeshBasicMaterial({ map: tex, toneMapped: false }));
  screen.position.z = 0.145;
  g.add(shadowed(frame, true, false), screen);

  const glow = new MeshBasicMaterial({
    map: glowTex,
    color: new Color(spec.bg).lerp(new Color("#ffffff"), 0.25),
    transparent: true,
    opacity: 0,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const halo = new Mesh(new PlaneGeometry(w * 1.9, h * 2.2), glow);
  halo.position.z = -0.2;
  halo.renderOrder = 6;
  g.add(halo);

  // a haste cromada que segura a tela
  const stem = new Mesh(new CylinderGeometry(0.06, 0.06, 1.4, 10), M.chrome);
  stem.position.y = -h / 2 - 0.7;
  g.add(stem);

  let x: number, y: number, z: number;
  if (zn.kind === "atrium") { x = zn.x + 3.6; y = 5.0; z = zn.z - 7.0; }
  else if (zn.kind === "hill") { x = zn.x + 6.5; y = 4.8; z = zn.z - 5.5; }
  else { x = zn.x + 2.3; y = 3.6; z = zn.z - 4.6; }
  g.position.set(x, y, z);
  g.rotation.y = Math.PI / 4;
  return { group: g, base: y, phase: zn.x * 0.13 + zn.z * 0.07, glow };
}

/* ---------------- a colina ---------------- */

function hill(zn: Zone) {
  const g = new Group();
  const R = HILL_RADIUS;
  const geo = new RingGeometry(0.001, R, 72, 26);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position as BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  const r = rng(4242);
  const top = new Color("#8fdc4a");
  const mid = new Color("#47a52c");
  const low = new Color("#2d7f24");
  const c = new Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = groundY(zn.x + x, zn.z + z);
    pos.setY(i, y);
    const k = y / 3.4;
    c.lerpColors(low, mid, Math.min(1, k * 2)).lerp(top, Math.max(0, k * 1.6 - 0.6));
    // listras de vento, como uma colina de papel de parede
    const streak = Math.sin(x * 0.9 + z * 0.35) * 0.04 + (r() - 0.5) * 0.07;
    col[i * 3] = c.r * (1 + streak);
    col[i * 3 + 1] = c.g * (1 + streak);
    col[i * 3 + 2] = c.b * (1 + streak);
  }
  geo.setAttribute("color", new BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const grass = standard("#ffffff", { rough: 0.85 });
  grass.vertexColors = true;
  const turf = new Mesh(geo, grass);
  turf.position.set(zn.x, 0, zn.z);
  turf.receiveShadow = true;
  g.add(turf);

  const slab = new Mesh(new CylinderGeometry(R, R * 0.96, 1.4, 64), M.white);
  slab.position.set(zn.x, -0.72, zn.z);
  const cone = new Mesh(new CylinderGeometry(R * 0.86, 0.3, 16, 10), M.trunk);
  cone.position.set(zn.x, -1.42 - 8, zn.z);
  g.add(slab, cone);
  return onLayer(g, BELOW);
}
