import {
  CapsuleGeometry,
  ExtrudeGeometry,
  Mesh,
  Path,
  Quaternion,
  Shape,
  Vector3,
  type BufferGeometry,
  type Material,
  type Object3D,
} from "three";

const UP = new Vector3(0, 1, 0);
const capsuleCache = new Map<string, CapsuleGeometry>();

/** um tubo de ponta redonda entre dois pontos: a peça básica de quase tudo aqui */
export function tube(a: Vector3, b: Vector3, r: number, mat: Material) {
  const dir = new Vector3().subVectors(b, a);
  const len = dir.length();
  const key = `${r.toFixed(3)}:${len.toFixed(3)}`;
  let g = capsuleCache.get(key);
  if (!g) {
    g = new CapsuleGeometry(r, len, 6, 14);
    capsuleCache.set(key, g);
  }
  const m = new Mesh(g, mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.copy(new Quaternion().setFromUnitVectors(UP, dir.normalize()));
  return m;
}

export const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

export function shadowed<T extends Object3D>(o: T, cast = true, receive = true) {
  o.traverse((c) => {
    c.castShadow = cast;
    c.receiveShadow = receive;
  });
  return o;
}

export function onLayer<T extends Object3D>(o: T, layer: number) {
  o.traverse((c) => c.layers.set(layer));
  return o;
}

/* ---------------- arcos ---------------- */

export interface Opening {
  at: number;
  w: number;
  h: number;
  /** a que altura começa; 0 é uma porta */
  y?: number;
}

/**
 * Um muro com vãos em arco, extrudado de um desenho 2D.
 * Portas tocam o chão, então entram no contorno; janelas são furos.
 */
export function archWall(len: number, height: number, depth: number, openings: Opening[]): BufferGeometry {
  const L = len / 2;
  const s = new Shape();
  const doors = openings.filter((o) => !o.y).sort((a, b) => a.at - b.at);
  const windows = openings.filter((o) => o.y);

  s.moveTo(-L, 0);
  for (const d of doors) {
    const r = d.w / 2;
    s.lineTo(d.at - r, 0);
    s.lineTo(d.at - r, d.h - r);
    s.absarc(d.at, d.h - r, r, Math.PI, 0, true);
    s.lineTo(d.at + r, 0);
  }
  s.lineTo(L, 0);
  s.lineTo(L, height);
  s.lineTo(-L, height);
  s.lineTo(-L, 0);

  for (const w of windows) {
    const r = w.w / 2;
    const y = w.y ?? 0;
    const p = new Path();
    p.moveTo(w.at - r, y);
    p.lineTo(w.at + r, y);
    p.lineTo(w.at + r, y + w.h - r);
    p.absarc(w.at, y + w.h - r, r, 0, Math.PI, false);
    p.lineTo(w.at - r, y);
    s.holes.push(p);
  }

  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 14 });
  g.translate(0, 0, -depth / 2);
  return g;
}

/** a ponte vista de lado: um tabuleiro com um arco abatido por baixo */
export function bridgeArch(len: number, width: number, drop: number): BufferGeometry {
  const L = len / 2;
  const foot = Math.min(0.9, len * 0.08);
  const s = new Shape();
  s.moveTo(-L, 0);
  s.lineTo(L, 0);
  s.lineTo(L, -drop);
  s.lineTo(L - foot, -drop);
  s.absellipse(0, -drop, L - foot, drop - 0.5, 0, Math.PI, false, 0);
  s.lineTo(-L, -drop);
  s.lineTo(-L, 0);
  const g = new ExtrudeGeometry(s, { depth: width, bevelEnabled: false, curveSegments: 24 });
  g.translate(0, 0, -width / 2);
  return g;
}
