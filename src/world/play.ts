import {
  AdditiveBlending,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  Shape,
  SphereGeometry,
  Vector3,
} from "three";
import { M, iridescent } from "./materials";
import { PLACE, groundY, zoneById } from "./layout";
import { BELOW } from "./build";
import { onLayer } from "./geo";

/* ============================================================
   As coisas para brincar, espalhadas pela galeria:

   plataformas   anéis no chão que jogam o boneco para o alto
   bolhas        bolhas de vidro baixas que estouram quando
                 você encosta, e voltam depois de um tempo
   estrelas      oito estrelas escondidas; achar todas deixa o
                 boneco dourado (e a galeria lembra disso)
   ============================================================ */

type Emit = (p: Vector3, color: string, n: number, spread?: number, speed?: number) => void;

/* ---------------- plataformas de salto ---------------- */

export function jumpPads() {
  const atrio = zoneById("atrio")!;
  const flip = zoneById("fliperama")!;
  const spots = [
    { x: atrio.x + PLACE.atrium.pad[0], z: atrio.z + PLACE.atrium.pad[1] },
    { x: flip.x + PLACE.arcade.pad[0], z: flip.z + PLACE.arcade.pad[1] },
  ];
  const g = new Group();
  const rings: { m: Mesh; mat: MeshBasicMaterial; glow: MeshBasicMaterial; kick: number }[] = [];
  for (const s of spots) {
    const disc = new Mesh(new CylinderGeometry(0.95, 1.05, 0.12, 40), M.chrome);
    disc.position.set(s.x, 0.06, s.z);
    const mat = new MeshBasicMaterial({ color: "#ff6fc8", transparent: true, opacity: 0.8, depthWrite: false });
    const ring = new Mesh(new RingGeometry(0.62, 0.82, 40), mat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(s.x, 0.13, s.z);
    const glow = new MeshBasicMaterial({ color: "#ff9edf", transparent: true, opacity: 0.2, blending: AdditiveBlending, depthWrite: false, side: 2 });
    const beam = new Mesh(new CylinderGeometry(0.75, 0.75, 2.4, 32, 1, true), glow);
    beam.position.set(s.x, 1.3, s.z);
    g.add(disc, onLayer(ring, BELOW), beam);
    rings.push({ m: ring, mat, glow, kick: 0 });
  }
  return {
    object: g,
    spots,
    /** devolve true se o boneco pisou numa plataforma agora */
    test(x: number, z: number) {
      for (let i = 0; i < spots.length; i++) {
        if (Math.hypot(x - spots[i].x, z - spots[i].z) < 0.85) {
          rings[i].kick = 1;
          return spots[i];
        }
      }
      return null;
    },
    tick(t: number, dt: number) {
      rings.forEach((r, i) => {
        r.kick = Math.max(0, r.kick - dt * 2);
        const pulse = 0.5 + 0.5 * Math.sin(t * 4 + i);
        r.m.scale.setScalar(1 + pulse * 0.08 + r.kick * 0.6);
        r.mat.opacity = 0.55 + pulse * 0.35;
        r.glow.opacity = 0.1 + pulse * 0.08 + r.kick * 0.5;
      });
    },
  };
}

/* ---------------- bolhas de estourar ---------------- */

export function popBubbles() {
  const spots: [string, number, number][] = [
    ["atrio", 3.5, 6.5], ["atrio", -6.5, 2.5], ["lagoa", 7.5, -4.5], ["lagoa", -3, 8.5],
    ["mirante", 5.5, 3.5], ["jardim", 6, 1], ["jardim", -1.5, 6.5], ["colina", 3.5, 6.5],
    ["estante", 3.5, 4.5], ["fliperama", -2, 4.5],
  ];
  const g = new Group();
  const geo = new SphereGeometry(0.36, 24, 16);
  const items = spots.map(([id, dx, dz], i) => {
    const zn = zoneById(id)!;
    const b = new Group();
    const back = new Mesh(geo, M.glassBack);
    const front = new Mesh(geo, M.glass);
    back.renderOrder = 3;
    front.renderOrder = 4;
    b.add(back, front);
    const x = zn.x + dx;
    const z = zn.z + dz;
    g.add(b);
    return { b, x, z, y: groundY(x, z) + 1.25, ph: i * 1.7, gone: 0 };
  });
  return {
    object: g,
    tick(t: number, dt: number, p: Vector3, height: number, emit: Emit, onPop: () => void) {
      for (const it of items) {
        if (it.gone > 0) {
          it.gone -= dt;
          it.b.visible = it.gone <= 0;
          if (it.gone <= 0) it.b.scale.setScalar(0.01);
          continue;
        }
        it.b.scale.setScalar(Math.min(1, it.b.scale.x + dt * 2));
        const y = it.y + Math.sin(t * 1.3 + it.ph) * 0.18;
        const x = it.x + Math.sin(t * 0.7 + it.ph) * 0.25;
        it.b.position.set(x, y, it.z);
        // encostou (andando, pulando ou rolando): estoura
        const body = p.y + height + 1;
        if (Math.hypot(p.x - x, p.z - it.z) < 0.75 && Math.abs(body - y) < 1.1) {
          it.gone = 7;
          it.b.visible = false;
          emit(new Vector3(x, y, it.z), "#bff3ff", 10, 0.5, 2.2);
          emit(new Vector3(x, y, it.z), "#ffffff", 6, 0.4, 1.6);
          onPop();
        }
      }
    },
  };
}

/* ---------------- estrelas escondidas ---------------- */

const KEY = "von:estrelas";

function starShape() {
  const s = new Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    const r = i % 2 ? 0.16 : 0.5;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const g = new ExtrudeGeometry(s, { depth: 0.12, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  g.center();
  return g;
}

export function hiddenStars() {
  const at = (id: string, dx: number, dz: number, y = 1.1) => {
    const zn = zoneById(id)!;
    return { x: zn.x + dx, z: zn.z + dz, y: groundY(zn.x + dx, zn.z + dz) + y };
  };
  const atrio = zoneById("atrio")!;
  const flip = zoneById("fliperama")!;
  const spots = [
    at("atrio", -7.4, 7.4),
    { x: 28, z: -14, y: 1.1 },
    at("colina", -5.2, -8.3),
    at("lagoa", 8.6, -2.2),
    at("mirante", 3.4, -6.6),
    at("jardim", -6.4, -5.2),
    // estas duas só com a plataforma de salto
    { x: atrio.x + PLACE.atrium.pad[0], z: atrio.z + PLACE.atrium.pad[1], y: 5.6 },
    { x: flip.x + PLACE.arcade.pad[0], z: flip.z + PLACE.arcade.pad[1], y: 5.6 },
  ];
  let got = new Set<number>();
  try {
    got = new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]") as number[]);
  } catch { /* sem armazenamento, começa do zero */ }

  const g = new Group();
  const geo = starShape();
  const mat = iridescent("#ffd6f2");
  const halo = new MeshBasicMaterial({ color: "#ff9edf", transparent: true, opacity: 0.35, blending: AdditiveBlending, depthWrite: false });
  const items = spots.map((s, i) => {
    const m = new Group();
    m.add(new Mesh(geo, mat));
    const h = new Mesh(new SphereGeometry(0.55, 16, 12), halo);
    m.add(h);
    m.position.set(s.x, s.y, s.z);
    m.visible = !got.has(i);
    g.add(m);
    return { m, s, i };
  });

  return {
    object: g,
    total: spots.length,
    get count() { return got.size; },
    tick(t: number, p: Vector3, height: number, emit: Emit, onGet: (count: number) => void) {
      for (const it of items) {
        if (!it.m.visible) continue;
        it.m.rotation.y = t * 2 + it.i;
        it.m.position.y = it.s.y + Math.sin(t * 2 + it.i) * 0.12;
        if (Math.random() < 0.04) emit(it.m.position.clone(), "#ff9edf", 1, 0.6, 0.3);
        const feet = p.y + height;
        if (Math.hypot(p.x - it.s.x, p.z - it.s.z) < 0.95 && it.s.y > feet - 0.3 && it.s.y < feet + 2.3) {
          it.m.visible = false;
          got.add(it.i);
          try { localStorage.setItem(KEY, JSON.stringify([...got])); } catch { /* fica só nesta visita */ }
          emit(it.m.position.clone(), "#ffd6f2", 18, 0.6, 3);
          emit(it.m.position.clone(), "#ffffff", 12, 0.5, 2.4);
          onGet(got.size);
        }
      }
    },
  };
}
