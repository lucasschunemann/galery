import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  NormalBlending,
  Points,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { M, U } from "./materials";
import { rng } from "./env";
import { BRIDGES, ZONES } from "./layout";
import { BELOW } from "./build";
import { onLayer } from "./geo";

/* ============================================================
   O que flutua: um mar de nuvens embaixo das ilhas, cubos
   soltos no ar, bolhas de vidro e brilhos de quatro pontas.
   ============================================================ */

const BOUNDS = { x0: -90, x1: 80, z0: -110, z1: 70 };

function nearWalk(x: number, z: number, pad: number) {
  for (const zn of ZONES) {
    if (Math.abs(x - zn.x) < zn.half + pad && Math.abs(z - zn.z) < zn.half + pad) return true;
  }
  for (const b of BRIDGES) {
    const along = b.axis === "x" ? x : z;
    const across = b.axis === "x" ? z : x;
    if (along > b.from - pad && along < b.to + pad && Math.abs(across - b.at) < 1.5 + pad) return true;
  }
  return false;
}

/* ---------------- nuvens ---------------- */

export function clouds() {
  const r = rng(91);
  const CL = 20;
  const parts: { cx: number; cy: number; cz: number; ox: number; oy: number; oz: number; s: number; speed: number }[] = [];
  for (let i = 0; i < CL; i++) {
    const cx = BOUNDS.x0 + r() * (BOUNDS.x1 - BOUNDS.x0);
    const cz = BOUNDS.z0 + r() * (BOUNDS.z1 - BOUNDS.z0);
    const cy = -12 - r() * 6;
    const n = 5 + ((r() * 4) | 0);
    const speed = 0.5 + r() * 0.5;
    for (let k = 0; k < n; k++) {
      const s = 1.6 + r() * 2.4 * (1 - Math.abs(k - n / 2) / n);
      parts.push({ cx, cy, cz, ox: (k - n / 2) * 2 + r() * 1.2, oy: r() * 1.4 - s * 0.3, oz: (r() - 0.5) * 3, s, speed });
    }
  }
  const mesh = new InstancedMesh(new SphereGeometry(1, 14, 10), M.cloud, parts.length);
  mesh.frustumCulled = false;
  const m4 = new Matrix4();
  const q = new Quaternion();
  const sc = new Vector3();
  const p = new Vector3();
  const W = BOUNDS.x1 - BOUNDS.x0;
  const tick = (t: number) => {
    parts.forEach((c, i) => {
      let x = c.cx + c.ox + t * c.speed;
      x = BOUNDS.x0 + ((((x - BOUNDS.x0) % W) + W) % W);
      p.set(x, c.cy + c.oy + Math.sin(t * 0.2 + c.cx) * 0.3, c.cz + c.oz);
      sc.set(c.s * 1.25, c.s * 0.85, c.s);
      m4.compose(p, q, sc);
      mesh.setMatrixAt(i, m4);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  tick(0);
  return { object: onLayer(mesh, BELOW), tick };
}

/* ---------------- cubos soltos ---------------- */

export function cubes() {
  const r = rng(5);
  const items: { p: Vector3; s: number; ax: Vector3; w: number; ph: number }[] = [];
  let guard = 0;
  while (items.length < 44 && guard++ < 2000) {
    const x = BOUNDS.x0 + 10 + r() * (BOUNDS.x1 - BOUNDS.x0 - 20);
    const z = BOUNDS.z0 + 20 + r() * (BOUNDS.z1 - BOUNDS.z0 - 30);
    const y = -6 + r() * 15;
    // acima do piso, longe de onde se anda, para nunca tapar o boneco
    if (y > -2.5 && nearWalk(x, z, 3.5)) continue;
    if (y <= -2.5 && nearWalk(x, z, 0.5)) continue;
    items.push({
      p: new Vector3(x, y, z),
      s: 0.35 + r() * r() * 1.6,
      ax: new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize(),
      w: 0.1 + r() * 0.4,
      ph: r() * 10,
    });
  }
  const mesh = new InstancedMesh(new BoxGeometry(1, 1, 1), M.porcelain, items.length);
  mesh.castShadow = true;
  mesh.frustumCulled = false;
  const m4 = new Matrix4();
  const q = new Quaternion();
  const sc = new Vector3();
  const p = new Vector3();
  const tick = (t: number) => {
    items.forEach((c, i) => {
      q.setFromAxisAngle(c.ax, c.ph + t * c.w);
      p.copy(c.p);
      p.y += Math.sin(t * 0.5 + c.ph) * 0.4;
      sc.setScalar(c.s);
      m4.compose(p, q, sc);
      mesh.setMatrixAt(i, m4);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  tick(0);
  return { object: mesh, tick };
}

/* ---------------- bolhas ---------------- */

export function bubbles() {
  const r = rng(23);
  const g = new Group();
  const items: { m: Group; base: Vector3; ph: number }[] = [];
  const geo = new SphereGeometry(1, 32, 22);
  // algumas em volta do átrio, o resto espalhado
  const spots: [number, number, number, number][] = [
    [-9, 6.5, -2, 1.1], [-2, 7.8, -9.5, 0.7], [5, 7.2, -8, 0.5], [-7.5, 3.2, 4, 0.4], [9, 5, -3, 0.8],
  ];
  let guard = 0;
  while (spots.length < 22 && guard++ < 800) {
    const x = BOUNDS.x0 + r() * (BOUNDS.x1 - BOUNDS.x0);
    const z = BOUNDS.z0 + 20 + r() * (BOUNDS.z1 - BOUNDS.z0 - 20);
    if (nearWalk(x, z, 2)) continue;
    spots.push([x, 1 + r() * 9, z, 0.5 + r() * 1.3]);
  }
  for (const [x, y, z, s] of spots) {
    const b = new Group();
    const back = new Mesh(geo, M.glassBack);
    const front = new Mesh(geo, M.glass);
    back.renderOrder = 3;
    front.renderOrder = 4;
    b.add(back, front);
    b.scale.setScalar(s);
    b.position.set(x, y, z);
    g.add(b);
    items.push({ m: b, base: new Vector3(x, y, z), ph: r() * 10 });
  }
  const tick = (t: number) => {
    for (const it of items) {
      it.m.position.y = it.base.y + Math.sin(t * 0.6 + it.ph) * 0.5;
      it.m.position.x = it.base.x + Math.sin(t * 0.3 + it.ph * 2) * 0.3;
    }
  };
  return { object: g, tick };
}

/* ---------------- brilhos ---------------- */

const SPARK_VERT = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aLife;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uScale;
  varying vec3 vColor;
  varying float vLife;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    float tw = 0.55 + 0.45 * sin(uTime * 2.6 + aPhase * 6.2831);
    gl_PointSize = max(0.0, aSize * uScale * tw * aLife);
    vColor = aColor;
    vLife = aLife;
  }
`;

const SPARK_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vLife;
  void main() {
    vec2 p = abs(gl_PointCoord - 0.5) * 2.0;
    float s = sqrt(p.x) + sqrt(p.y);
    float a = 1.0 - smoothstep(0.82, 1.0, s);
    if (a < 0.05) discard;
    gl_FragColor = vec4(vColor * (1.0 + (1.0 - s) * 0.8), a * min(1.0, vLife * 2.0));
  }
`;

export function sparkles() {
  const AMB = 140;
  const LIVE = 220;
  const N = AMB + LIVE;
  const r = rng(77);
  const pos = new Float32Array(N * 3);
  const size = new Float32Array(N);
  const phase = new Float32Array(N);
  const life = new Float32Array(N);
  const color = new Float32Array(N * 3);
  const vel = new Float32Array(LIVE * 3);
  const decay = new Float32Array(LIVE);
  const palette = ["#ff9edf", "#ffffff", "#9ff3ff", "#ffc6ef"].map((c) => new Color(c));

  for (let i = 0; i < AMB; i++) {
    let x = 0, z = 0;
    // a maioria perto das ilhas, que é onde o olho está
    const zn = ZONES[(r() * ZONES.length) | 0];
    x = zn.x + (r() - 0.5) * (zn.half * 2 + 14);
    z = zn.z + (r() - 0.5) * (zn.half * 2 + 14);
    pos.set([x, 0.8 + r() * 9, z], i * 3);
    size[i] = 0.25 + r() * 0.45;
    phase[i] = r();
    life[i] = 1;
    const c = palette[(r() * palette.length) | 0];
    color.set([c.r, c.g, c.b], i * 3);
  }

  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(pos, 3));
  geo.setAttribute("aSize", new BufferAttribute(size, 1));
  geo.setAttribute("aPhase", new BufferAttribute(phase, 1));
  geo.setAttribute("aLife", new BufferAttribute(life, 1));
  geo.setAttribute("aColor", new BufferAttribute(color, 3));

  const mat = new ShaderMaterial({
    uniforms: { uTime: U.uTime, uScale: { value: 20 } },
    vertexShader: SPARK_VERT,
    fragmentShader: SPARK_FRAG,
    transparent: true,
    depthWrite: false,
    blending: NormalBlending,
  });
  const points = new Points(geo, mat);
  points.frustumCulled = false;
  points.renderOrder = 5;

  let cursor = 0;
  const tmp = new Color();
  const emit = (p: Vector3, hex: string, n: number, spread = 0.3, speed = 1) => {
    tmp.set(hex);
    for (let k = 0; k < n; k++) {
      const i = cursor;
      cursor = (cursor + 1) % LIVE;
      const j = AMB + i;
      pos.set([p.x + (Math.random() - 0.5) * spread, p.y + (Math.random() - 0.5) * spread, p.z + (Math.random() - 0.5) * spread], j * 3);
      vel.set([(Math.random() - 0.5) * speed, (Math.random() * 0.8 + 0.2) * speed, (Math.random() - 0.5) * speed], i * 3);
      size[j] = 0.35 + Math.random() * 0.4;
      phase[j] = Math.random();
      life[j] = 1;
      decay[i] = 0.7 + Math.random() * 0.6;
      color.set([tmp.r, tmp.g, tmp.b], j * 3);
    }
  };

  const tick = (dt: number, scale: number) => {
    mat.uniforms.uScale.value = scale;
    for (let i = 0; i < LIVE; i++) {
      const j = AMB + i;
      if (life[j] <= 0) continue;
      life[j] = Math.max(0, life[j] - dt * decay[i]);
      pos[j * 3] += vel[i * 3] * dt;
      pos[j * 3 + 1] += vel[i * 3 + 1] * dt;
      pos[j * 3 + 2] += vel[i * 3 + 2] * dt;
      vel[i * 3 + 1] *= 0.98;
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.aLife.needsUpdate = true;
    geo.attributes.aSize.needsUpdate = true;
    geo.attributes.aColor.needsUpdate = true;
    geo.attributes.aPhase.needsUpdate = true;
  };

  return { object: points, tick, emit };
}

