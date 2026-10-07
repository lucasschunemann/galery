import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  LatheGeometry,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { M, anodized, gloss, standard } from "./materials";
import { shadowed, tube, v } from "./geo";
import { SPOON, groundY, type Zone } from "./layout";

/* ============================================================
   As esculturas. Cada trabalho vira um objeto no pedestal,
   em cromo, porcelana e vidro, como os renders de demo de
   placa de vídeo do começo dos anos 2000:

   01 Acompanha       um gráfico de tijolos com a linha do preço
   02 Acronos         um cubo de módulos que se reorganiza
   03 Sendeski Café   uma xícara cromada, grãos em órbita
   04 WF Odontologia  um dente de porcelana que brilha
   05 TravelDone      um globo de vidro com um avião de papel
   06 PF Advogados    uma balança que nunca se decide
   Sobre              a mão cromada fazendo "oi"
   Contato            uma antena que manda sinais
   Átrio              VON em tubos cromados
   Colina             a estrela cromada, e alguém espiando
   ============================================================ */

export interface Ctx {
  t: number;
  dt: number;
  player: Vector3;
  near: number;
  emit: (p: Vector3, color: string, n: number, spread?: number, speed?: number) => void;
}

export interface Sculpture {
  group: Group;
  tick: (c: Ctx) => void;
}

const TOP = 0.9; // altura do tampo do pedestal
const FACE = Math.PI / 4; // virado para a câmera

const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export function buildSculpture(zn: Zone): Sculpture {
  const s =
    zn.kind === "atrium" ? von()
    : zn.kind === "about" ? hand(zn.color)
    : zn.kind === "contact" ? dish(zn.color)
    : zn.kind === "hill" ? star(zn)
    : [bricks, modules, cup, tooth, globe, scale][zn.project ?? 0](zn.color);
  s.group.position.set(zn.focus.x, 0, zn.focus.z);
  if (zn.kind === "work" || zn.kind === "about" || zn.kind === "contact") {
    // um pouco maior que o desenho, crescendo a partir do tampo do pedestal
    const k = 1.22;
    s.group.scale.setScalar(k);
    s.group.position.y = TOP - TOP * k;
  }
  shadowed(s.group, true, true);
  return s;
}

/* ---------------- VON ---------------- */

function von(): Sculpture {
  const g = new Group();
  g.rotation.y = FACE;
  const ped = new Mesh(new BoxGeometry(9, 0.9, 1.9), M.white);
  ped.position.y = 0.45;
  const band = new Mesh(new BoxGeometry(9.04, 0.12, 1.94), anodized("#4aa8ff", 0.2));
  band.position.y = 0.86;
  g.add(ped, band);

  const L = new Group();
  L.position.y = 1.4;
  const r = 0.34;
  const H = 3.1;
  L.add(
    tube(v(-3.95, H, 0), v(-3.0, 0, 0), r, M.chrome),
    tube(v(-2.05, H, 0), v(-3.0, 0, 0), r, M.chrome),
  );
  const O = new Mesh(new TorusGeometry(H / 2 - r, r, 20, 48), M.chrome);
  O.position.y = H / 2;
  L.add(O);
  L.add(
    tube(v(2.15, 0, 0), v(2.15, H, 0), r, M.chrome),
    tube(v(3.9, 0, 0), v(3.9, H, 0), r, M.chrome),
    tube(v(2.15, H, 0), v(3.9, 0, 0), r, M.chrome),
  );
  g.add(L);

  let next = 0;
  return {
    group: g,
    tick: ({ t, emit }) => {
      L.position.y = 1.4 + Math.sin(t * 1.1) * 0.12;
      O.rotation.y = t * 0.9;
      if (t > next) {
        next = t + 0.35;
        const p = new Vector3((Math.random() - 0.5) * 9, 1.5 + Math.random() * 3.4, (Math.random() - 0.5) * 1.5);
        g.localToWorld(p);
        emit(p, Math.random() > 0.5 ? "#ff9ee0" : "#ffffff", 1, 0.1, 0.4);
      }
    },
  };
}

/* ---------------- 01 tijolos ---------------- */

function bricks(color: string): Sculpture {
  const g = new Group();
  g.rotation.y = FACE;
  const heights = [2, 3, 3, 5, 6];
  const brick = new BoxGeometry(0.52, 0.3, 0.52);
  const accent = gloss(color, { rough: 0.3 });
  const cols: Group[] = [];
  const tops: Vector3[] = [];
  heights.forEach((h, i) => {
    const col = new Group();
    const x = (i - 2) * 0.66;
    col.position.set(x, TOP, 0);
    for (let j = 0; j < h; j++) {
      const b = new Mesh(brick, (i + j) % 2 ? M.porcelain : accent);
      b.position.y = 0.16 + j * 0.33;
      col.add(b);
    }
    g.add(col);
    cols.push(col);
    tops.push(new Vector3(x, TOP + h * 0.33 + 0.55, 0));
  });
  const curve = new CatmullRomCurve3([
    new Vector3(-1.85, TOP + 0.6, 0),
    ...tops,
    new Vector3(1.75, TOP + 2.9, 0),
  ]);
  const line = new Mesh(new TubeGeometry(curve, 80, 0.055, 8), M.chrome);
  g.add(line);

  const marker = new Group();
  const core = new Mesh(new SphereGeometry(0.1, 16, 12), anodized(color, 0.15));
  const shell = new Mesh(new SphereGeometry(0.24, 24, 16), M.glass);
  marker.add(core, shell);
  g.add(marker);

  return {
    group: g,
    tick: ({ t }) => {
      cols.forEach((c, i) => (c.scale.y = 1 + 0.07 * Math.sin(t * 1.5 + i * 0.9)));
      const u = (t * 0.16) % 1;
      marker.position.copy(curve.getPointAt(u));
    },
  };
}

/* ---------------- 02 módulos ---------------- */

function modules(color: string): Sculpture {
  const g = new Group();
  g.position.y = 0;
  const N = 27;
  const mat = gloss("#ffffff", { rough: 0.22 });
  const mesh = new InstancedMesh(new BoxGeometry(0.62, 0.62, 0.62), mat, N);
  const coords: Vector3[] = [];
  const quats: Quaternion[] = [];
  const accent = new Color(color);
  const grey = new Color("#cdd3e0");
  const white = new Color("#ffffff");
  let k = 0;
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++) {
        coords.push(new Vector3(x, y, z));
        quats.push(new Quaternion());
        mesh.setColorAt(k++, y === 1 ? accent : x === 1 ? grey : white);
      }
  const holder = new Group();
  holder.position.y = TOP + 1.55;
  holder.add(mesh);
  g.add(holder);

  const m4 = new Matrix4();
  const q = new Quaternion();
  const p = new Vector3();
  const one = new Vector3(1, 1, 1);
  const AX = [new Vector3(1, 0, 0), new Vector3(0, 1, 0), new Vector3(0, 0, 1)];
  let move: { axis: number; layer: number; dir: number; t0: number } | null = null;
  let nextMove = 1.5;

  return {
    group: g,
    tick: ({ t }) => {
      const gap = 0.7 + 0.17 * (0.5 + 0.5 * Math.sin(t * 0.8));
      holder.rotation.y = t * 0.25;
      holder.position.y = TOP + 1.6 + Math.sin(t * 1.1) * 0.08;

      if (!move && t > nextMove) {
        move = { axis: (Math.random() * 3) | 0, layer: ((Math.random() * 3) | 0) - 1, dir: Math.random() > 0.5 ? 1 : -1, t0: t };
      }
      let angle = 0;
      let done = false;
      if (move) {
        const prog = Math.min(1, (t - move.t0) / 0.75);
        angle = ease(prog) * (Math.PI / 2) * move.dir;
        done = prog >= 1;
      }
      for (let i = 0; i < N; i++) {
        p.copy(coords[i]);
        q.copy(quats[i]);
        if (move && Math.round(coords[i].getComponent(move.axis)) === move.layer) {
          const r = new Quaternion().setFromAxisAngle(AX[move.axis], angle);
          p.applyQuaternion(r);
          q.premultiply(r);
          if (done) {
            coords[i].set(Math.round(p.x), Math.round(p.y), Math.round(p.z));
            quats[i].copy(q);
          }
        }
        m4.compose(p.multiplyScalar(gap), q, one);
        mesh.setMatrixAt(i, m4);
      }
      mesh.instanceMatrix.needsUpdate = true;
      if (done) {
        move = null;
        nextMove = t + 1.2 + Math.random() * 1.2;
      }
    },
  };
}

/* ---------------- 03 xícara ---------------- */

function cup(color: string): Sculpture {
  const g = new Group();
  g.rotation.y = FACE;
  const S = 1.45;
  const profile = [
    [0, 0], [0.4, 0], [0.48, 0.04], [0.54, 0.18], [0.6, 0.55], [0.65, 0.9], [0.69, 0.98],
    [0.67, 1.01], [0.62, 0.95], [0.58, 0.8], [0, 0.8],
  ].map(([x, y]) => new Vector2(x * S, y * S));
  const body = new Mesh(new LatheGeometry(profile, 56), M.chrome);
  const saucerProfile = [[0, 0], [1.2, 0.02], [1.34, 0.1], [1.3, 0.13], [0.62, 0.08], [0, 0.08]]
    .map(([x, y]) => new Vector2(x, y));
  const saucer = new Mesh(new LatheGeometry(saucerProfile, 56), M.porcelain);
  const cupG = new Group();
  cupG.position.y = TOP + 0.08;
  body.position.y = 0;
  const handle = new Mesh(new TorusGeometry(0.33, 0.085, 12, 28), M.chrome);
  handle.position.set(0.62 * S + 0.16, 0.52 * S, 0);
  const coffee = new Mesh(new CircleGeometry(0.585 * S, 40), gloss("#3a1d0c", { rough: 0.15 }));
  coffee.rotation.x = -Math.PI / 2;
  coffee.position.y = 0.815 * S;
  cupG.add(body, handle, coffee);
  saucer.position.y = TOP;
  g.add(saucer, cupG);

  const steam: Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const s = new Mesh(new SphereGeometry(0.3, 18, 12), M.glass);
    steam.push(s);
    g.add(s);
  }

  const beans: Group[] = [];
  const beanMat = gloss(color, { rough: 0.28 });
  for (let i = 0; i < 3; i++) {
    const b = new Group();
    const shell = new Mesh(new SphereGeometry(0.3, 24, 16), beanMat);
    shell.scale.set(1, 0.66, 1.4);
    const groove = tube(v(0, 0.19, -0.34), v(0, 0.19, 0.34), 0.035, M.ink);
    b.add(shell, groove);
    beans.push(b);
    g.add(b);
  }

  return {
    group: g,
    tick: ({ t }) => {
      steam.forEach((s, i) => {
        const ph = (t * 0.3 + i / steam.length) % 1;
        s.position.set(Math.sin(t * 1.2 + i * 2) * 0.3 * ph, TOP + 1.7 + ph * 2.4, Math.cos(t + i) * 0.15 * ph);
        s.scale.setScalar(Math.sin(ph * Math.PI) * (0.6 + ph * 0.8));
      });
      beans.forEach((b, i) => {
        const a = t * 0.6 + (i * Math.PI * 2) / 3;
        b.position.set(Math.cos(a) * 1.75, TOP + 1.3 + Math.sin(t * 1.3 + i) * 0.25, Math.sin(a) * 1.75);
        b.rotation.set(t * 0.7 + i, a, t * 0.4);
      });
    },
  };
}

/* ---------------- 04 dente ---------------- */

function tooth(_color: string): Sculpture {
  const g = new Group();
  const crownGeo = new SphereGeometry(1, 56, 40);
  const pos = crownGeo.attributes.position as BufferAttribute;
  const cusps = [[0.42, 0.4], [-0.42, 0.4], [0.42, -0.4], [-0.42, -0.4]];
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    if (y > 0) {
      let bump = 0;
      for (const [cx, cz] of cusps) bump += Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / 0.06);
      y = y * 0.5 + bump * 0.24 * y;
    } else {
      const k = 1 - 0.2 * -y;
      x *= k;
      z *= k;
      y *= 0.78;
    }
    pos.setXYZ(i, x * 1.02, y, z * 0.9);
  }
  crownGeo.computeVertexNormals();
  const T = new Group();
  T.add(new Mesh(crownGeo, M.porcelain));
  for (const sx of [-1, 1]) {
    const root = new Mesh(new CylinderGeometry(0.36, 0.11, 1.55, 24), M.porcelain);
    root.position.set(sx * 0.36, -1.12, 0);
    root.rotation.z = sx * 0.16;
    const tip = new Mesh(new SphereGeometry(0.11, 14, 10), M.porcelain);
    tip.position.set(sx * 0.36 + sx * 0.12, -1.9, 0);
    T.add(root, tip);
  }
  g.add(T);

  let next = 0;
  return {
    group: g,
    tick: ({ t, emit, near }) => {
      T.position.y = TOP + 2.25 + Math.sin(t * 1.2) * 0.14;
      T.rotation.y = t * 0.45;
      T.rotation.z = Math.sin(t * 0.7) * 0.08;
      if (t > next) {
        next = t + (near > 0.5 ? 0.18 : 0.5);
        const d = new Vector3().randomDirection().multiplyScalar(1.4);
        d.y = Math.abs(d.y) * 0.8;
        const p = d.add(T.position);
        g.localToWorld(p);
        emit(p, Math.random() > 0.3 ? "#ffffff" : "#8ff7e6", 1, 0.05, 0.2);
      }
    },
  };
}

/* ---------------- 05 globo ---------------- */

function plane() {
  const pts = [
    0, 0, 0.6, -0.46, 0.05, -0.42, 0, 0, -0.4,
    0, 0, 0.6, 0, 0, -0.4, 0.46, 0.05, -0.42,
    0, 0, 0.6, 0, -0.17, -0.38, 0, 0, -0.4,
  ];
  const geo = new BufferGeometry();
  geo.setAttribute("position", new BufferAttribute(new Float32Array(pts), 3));
  geo.computeVertexNormals();
  return geo;
}

function globe(color: string): Sculpture {
  const g = new Group();
  const C = TOP + 2.3;
  const stem = new Mesh(new CylinderGeometry(0.08, 0.12, 1.4, 12), M.chrome);
  stem.position.y = TOP + 0.6;
  const cradle = new Mesh(new TorusGeometry(0.42, 0.06, 8, 32), M.chrome);
  cradle.rotation.x = Math.PI / 2;
  cradle.position.y = TOP + 1.3;
  g.add(stem, cradle);

  const core = new Mesh(new SphereGeometry(0.34, 24, 16), gloss(color, { rough: 0.2 }));
  core.position.y = C;
  const back = new Mesh(new SphereGeometry(1.05, 40, 28), M.glassBack);
  const front = new Mesh(new SphereGeometry(1.05, 40, 28), M.glass);
  back.position.y = front.position.y = C;
  back.renderOrder = 3;
  front.renderOrder = 4;
  g.add(core, back, front);

  const rings: Mesh[] = [];
  const tilts = [[0.41, 0], [Math.PI / 2, 0.3], [1.1, -0.9]];
  for (const [rx, rz] of tilts) {
    const ring = new Mesh(new TorusGeometry(1.3, 0.045, 8, 72), M.chrome);
    ring.position.y = C;
    ring.rotation.set(rx, 0, rz);
    rings.push(ring);
    g.add(ring);
  }

  const plane3 = new Mesh(plane(), gloss("#ffffff", { rough: 0.3, side: DoubleSide }));
  plane3.castShadow = true;
  g.add(plane3);
  const tilt = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0.4).normalize(), 0.38);
  const prev = new Vector3();
  let next = 0;

  return {
    group: g,
    tick: ({ t, emit }) => {
      rings[0].rotation.z = t * 0.3;
      rings[1].rotation.y = t * 0.4;
      rings[2].rotation.x = 1.1 + Math.sin(t * 0.5) * 0.3;
      core.rotation.y = t;
      const a = t * 0.85;
      const p = new Vector3(Math.cos(a) * 2.05, 0, Math.sin(a) * 2.05).applyQuaternion(tilt);
      p.y += C;
      prev.copy(plane3.position);
      plane3.position.copy(p);
      const ahead = new Vector3(-Math.sin(a), 0, Math.cos(a)).applyQuaternion(tilt).add(p);
      plane3.lookAt(g.localToWorld(ahead.clone()));
      plane3.rotateZ(-0.5);
      if (t > next) {
        next = t + 0.06;
        emit(g.localToWorld(prev.clone()), "#ff8fd0", 1, 0.02, 0.05);
      }
    },
  };
}

/* ---------------- 06 balança ---------------- */

function scale(color: string): Sculpture {
  const g = new Group();
  g.rotation.y = FACE;
  const foot = new Mesh(new CylinderGeometry(0.55, 0.7, 0.22, 32), M.chrome);
  foot.position.y = TOP + 0.11;
  const post = new Mesh(new CylinderGeometry(0.07, 0.1, 2.7, 14), M.chrome);
  post.position.y = TOP + 1.45;
  const fin = new Mesh(new SphereGeometry(0.17, 18, 12), M.chrome);
  fin.position.y = TOP + 2.95;
  g.add(foot, post, fin);

  const PY = TOP + 2.7;
  const beam = new Group();
  beam.position.y = PY;
  beam.add(tube(v(-1.45, 0, 0), v(1.45, 0, 0), 0.055, M.chrome));
  g.add(beam);

  const panProfile = [[0, 0], [0.58, 0.14], [0.62, 0.2], [0.56, 0.17], [0, 0.04]].map(([x, y]) => new Vector2(x, y));
  const panGeo = new LatheGeometry(panProfile, 40);
  const pans: Group[] = [];
  const DROP = 1.25;
  for (let s = 0; s < 2; s++) {
    const pan = new Group();
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.5;
      pan.add(tube(v(0, 0, 0), v(Math.cos(a) * 0.56, -DROP + 0.18, Math.sin(a) * 0.56), 0.016, M.chromeSoft));
    }
    const dish = new Mesh(panGeo, M.chrome);
    dish.position.y = -DROP;
    pan.add(dish);
    const thing = s === 0
      ? new Mesh(new SphereGeometry(0.3, 24, 16), M.glass)
      : new Mesh(new BoxGeometry(0.42, 0.42, 0.42), gloss(color, { rough: 0.25 }));
    thing.position.y = -DROP + 0.38;
    if (s === 1) thing.rotation.y = 0.5;
    pan.add(thing);
    pans.push(pan);
    g.add(pan);
  }

  return {
    group: g,
    tick: ({ t }) => {
      const th = Math.sin(t * 0.55) * 0.13 + Math.sin(t * 1.7) * 0.02;
      beam.rotation.z = th;
      pans.forEach((pan, s) => {
        const sx = s === 0 ? -1 : 1;
        pan.position.set(sx * 1.45 * Math.cos(th), PY + sx * 1.45 * Math.sin(th), 0);
      });
    },
  };
}

/* ---------------- Sobre: a mão ---------------- */

function hand(_color: string): Sculpture {
  const g = new Group();
  g.rotation.y = FACE;
  const H = new Group();
  const palm = new Mesh(new SphereGeometry(1, 36, 24), M.chrome);
  palm.scale.set(0.78, 0.9, 0.4);
  H.add(palm);
  const f = (pts: Vector3[], r: number) => {
    for (let i = 0; i < pts.length - 1; i++) H.add(tube(pts[i], pts[i + 1], r, M.chrome));
  };
  f([v(-0.3, 0.7, 0), v(-0.66, 2.05, 0.04)], 0.21);
  f([v(0.12, 0.75, 0), v(0.36, 2.15, 0.04)], 0.21);
  f([v(0.42, 0.6, 0.08), v(0.48, 0.8, 0.44), v(0.42, 0.46, 0.58)], 0.19);
  f([v(0.64, 0.38, 0.06), v(0.7, 0.54, 0.38), v(0.62, 0.26, 0.46)], 0.16);
  f([v(-0.62, -0.12, 0.12), v(-0.28, 0.26, 0.52), v(0.16, 0.42, 0.6)], 0.21);
  const cuff = new Mesh(new TorusGeometry(0.46, 0.16, 14, 36), M.porcelain);
  cuff.rotation.x = Math.PI / 2;
  cuff.position.y = -0.92;
  const wrist = new Mesh(new CylinderGeometry(0.38, 0.42, 0.5, 24), M.chrome);
  wrist.position.y = -1.15;
  H.add(cuff, wrist);
  g.add(H);

  let next = 0;
  return {
    group: g,
    tick: ({ t, near, emit }) => {
      H.position.y = TOP + 2.4 + Math.sin(t * 1.1) * 0.12;
      const wave = near > 0.5 ? Math.sin(t * 7) * 0.22 : Math.sin(t * 1.3) * 0.08;
      H.rotation.z = -0.12 + wave;
      H.rotation.y = Math.sin(t * 0.5) * 0.25;
      if (near > 0.5 && t > next) {
        next = t + 0.25;
        emit(g.localToWorld(new Vector3((Math.random() - 0.5) * 2.4, TOP + 4.4, 0.3)), "#ffd2f1", 1, 0.1, 0.4);
      }
    },
  };
}

/* ---------------- Contato: a antena ---------------- */

function dish(color: string): Sculpture {
  const g = new Group();
  const mast = new Mesh(new CylinderGeometry(0.1, 0.16, 1.5, 14), M.chrome);
  mast.position.y = TOP + 0.75;
  const knuckle = new Mesh(new SphereGeometry(0.22, 18, 12), M.chrome);
  knuckle.position.y = TOP + 1.55;
  g.add(mast, knuckle);

  const D = new Group();
  D.position.y = TOP + 1.65;
  const k = 0.3;
  const pts: Vector2[] = [];
  for (let i = 0; i <= 14; i++) {
    const r = (i / 14) * 1.5;
    pts.push(new Vector2(r, r * r * k));
  }
  const bowl = new Mesh(new LatheGeometry(pts, 56), standard("#ffffff", { metal: 1, rough: 0.12, side: DoubleSide, env: 1.5 }));
  D.add(bowl);
  const rimY = 1.5 * 1.5 * k;
  const F = 1.35;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    D.add(tube(v(Math.cos(a) * 1.45, rimY, Math.sin(a) * 1.45), v(0, F, 0), 0.025, M.chromeSoft));
  }
  const horn = new Mesh(new SphereGeometry(0.16, 16, 12), new MeshBasicMaterial({ color: "#aaf6ff" }));
  horn.position.y = F;
  D.add(horn);

  const waveMat: MeshBasicMaterial[] = [];
  const waves: Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const mat = new MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false });
    const w = new Mesh(new TorusGeometry(0.4, 0.035, 6, 40), mat);
    w.rotation.x = Math.PI / 2;
    waveMat.push(mat);
    waves.push(w);
    D.add(w);
  }
  g.add(D);

  const aim = new Vector3(1, 1.25, 1).normalize();
  const base = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), aim);
  const wob = new Quaternion();

  return {
    group: g,
    tick: ({ t }) => {
      wob.setFromAxisAngle(new Vector3(0, 1, 0), Math.sin(t * 0.4) * 0.5);
      D.quaternion.copy(wob).multiply(base);
      waves.forEach((w, i) => {
        const ph = (t * 0.45 + i / 3) % 1;
        w.position.y = F + ph * 3.2;
        w.scale.setScalar(1 + ph * 3);
        waveMat[i].opacity = (1 - ph) * 0.85;
      });
    },
  };
}

/* ---------------- Colina: a estrela e a colher ---------------- */

function star(zn: Zone): Sculpture {
  const g = new Group();
  const S = new Group();
  S.position.y = 6;
  S.add(new Mesh(new SphereGeometry(0.55, 28, 18), M.chrome));
  const spike = new ConeGeometry(0.36, 2.5, 14);
  spike.translate(0, 1.25, 0);
  const n = 9;
  for (let i = 0; i < n; i++) {
    // pontos de Fibonacci na esfera, levemente torcidos
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = i * 2.399963;
    const dir = new Vector3(Math.cos(th) * r, y * 0.85, Math.sin(th) * r).normalize();
    const m = new Mesh(spike, M.chrome);
    m.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir);
    m.scale.set(1, 0.8 + ((i * 37) % 10) / 20, 1);
    S.add(m);
  }
  g.add(S);

  // a colher. Ela só queria ver a galeria também
  const spoon = new Group();
  spoon.position.set(SPOON.x - zn.focus.x, 0, SPOON.z - zn.focus.z);
  const baseY = groundY(SPOON.x, SPOON.z);
  const handle = new Mesh(new CylinderGeometry(0.16, 0.3, 4.6, 16), M.chrome);
  handle.position.y = baseY + 2.1;
  handle.rotation.z = 0.06;
  const bowl = new Mesh(new SphereGeometry(1, 36, 26), M.chrome);
  bowl.scale.set(1.15, 1.5, 0.36);
  bowl.position.y = baseY + 5.6;
  spoon.add(handle, bowl);
  const eyes: { ball: Mesh; pupil: Mesh }[] = [];
  const white = gloss("#ffffff", { rough: 0.15 });
  for (const sx of [-1, 1]) {
    const ball = new Mesh(new SphereGeometry(0.44, 24, 16), white);
    ball.position.set(sx * 0.48, baseY + 5.75, 0.3);
    const pupil = new Mesh(new SphereGeometry(0.22, 16, 12), M.ink);
    const brow = tube(v(sx * 0.2, baseY + 6.42, 0.38), v(sx * 0.78, baseY + 6.32 + 0.12, 0.3), 0.06, M.ink);
    spoon.add(ball, pupil, brow);
    eyes.push({ ball, pupil });
  }
  spoon.rotation.y = FACE;
  spoon.scale.setScalar(1.45);
  spoon.position.y = -baseY * 0.45;
  g.add(spoon);

  const tmp = new Vector3();
  const look = new Object3D();
  return {
    group: g,
    tick: ({ t, player }) => {
      S.rotation.y = t * 0.35;
      S.rotation.x = Math.sin(t * 0.3) * 0.25;
      S.position.y = 6 + Math.sin(t * 0.9) * 0.2;
      spoon.position.y = -baseY * 0.45 + Math.sin(t * 0.8) * 0.06;
      spoon.rotation.z = Math.sin(t * 0.5) * 0.04;
      // os olhos seguem o boneco
      for (const { ball, pupil } of eyes) {
        look.position.copy(ball.position);
        spoon.localToWorld(look.position);
        tmp.copy(player).setY(player.y + 1.4).sub(look.position).normalize();
        const inv = new Quaternion();
        spoon.getWorldQuaternion(inv).invert();
        tmp.applyQuaternion(inv);
        tmp.z = Math.max(tmp.z, 0.35);
        tmp.normalize();
        pupil.position.copy(ball.position).addScaledVector(tmp, 0.3);
      }
    },
  };
}
