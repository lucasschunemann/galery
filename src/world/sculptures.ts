import {
  AdditiveBlending,
  CanvasTexture,
  ExtrudeGeometry,
  IcosahedronGeometry,
  NearestFilter,
  PlaneGeometry,
  SRGBColorSpace,
  Shape,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CapsuleGeometry,
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
import { M, U, anodized, gloss, iridescent, standard } from "./materials";
import { onLayer, shadowed, tube, v } from "./geo";
import { BELOW } from "./build";
import { PLACE, POND_R, SPOON, groundY, type Zone } from "./layout";
import { ARTICLES } from "../data/site";

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
    : zn.kind === "pond" ? pond()
    : zn.kind === "lookout" ? lookout()
    : zn.kind === "arcade" ? arcade()
    : zn.kind === "library" ? library()
    : zn.kind === "garden" ? garden()
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

/* ---------------- A lagoa ---------------- */

function pond(): Sculpture {
  const g = new Group();

  const waterMat = gloss("#2fb6f0", { rough: 0.04 });
  waterMat.transparent = true;
  waterMat.opacity = 0.58;
  waterMat.depthWrite = false;
  const water = new Mesh(new CircleGeometry(POND_R, 72), waterMat);
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.16;
  water.renderOrder = 2;
  water.receiveShadow = true;
  g.add(onLayer(water, BELOW));

  const rim = new Mesh(new TorusGeometry(POND_R + 0.06, 0.11, 10, 120), M.chrome);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.02;
  g.add(rim);

  // vitórias-régias, com o corte de sempre
  const padMat = gloss("#56c845", { rough: 0.35 });
  const pads: { m: Group; a: number; r: number; w: number }[] = [];
  const padSpots: [number, number, number][] = [[1.1, 3.6, 0.7], [2.6, 4.6, 0.55], [4.1, 2.2, 0.8], [5.3, 3.9, 0.5], [0.2, 1.9, 0.45]];
  padSpots.forEach(([a, r, size], i) => {
    const p = new Group();
    const leaf = new Mesh(new CylinderGeometry(size, size, 0.05, 22, 1, false, 0.35, Math.PI * 2 - 0.7), padMat);
    p.add(leaf);
    if (i % 2 === 0) {
      const petal = gloss(i === 0 ? "#ff8fd0" : "#ffffff", { rough: 0.2 });
      for (let k = 0; k < 5; k++) {
        const f = new Mesh(new SphereGeometry(size * 0.22, 12, 8), petal);
        const ang = (k / 5) * Math.PI * 2;
        f.position.set(Math.cos(ang) * size * 0.2, 0.1, Math.sin(ang) * size * 0.2);
        f.scale.set(1, 0.6, 1.6);
        f.rotation.y = -ang;
        p.add(f);
      }
    }
    g.add(p);
    pads.push({ m: p, a, r, w: 0.02 + i * 0.008 });
  });

  // carpas de cromo, dando voltas debaixo da água
  const fish: { m: Group; tail: Mesh; r: number; w: number; a: number; y: number }[] = [];
  const fishCol = ["#ff7a2a", "#ffffff", "#ffb02a", "#ff4f6a"];
  for (let i = 0; i < 4; i++) {
    const f = new Group();
    const body = new Mesh(new SphereGeometry(0.3, 18, 12), anodized(fishCol[i], 0.16));
    body.scale.set(0.62, 0.5, 1.5);
    const tail = new Mesh(new ConeGeometry(0.2, 0.42, 4), anodized(fishCol[(i + 1) % 4], 0.2));
    tail.rotation.x = -Math.PI / 2;
    tail.position.z = -0.55;
    tail.scale.set(1, 1, 0.25);
    f.add(body, tail);
    g.add(onLayer(f, BELOW));
    fish.push({ m: f, tail, r: 2.2 + i * 0.8, w: (i % 2 ? -1 : 1) * (0.35 + i * 0.06), a: i * 1.7, y: -0.5 - (i % 2) * 0.18 });
  }

  // bolhas que sobem do fundo, e ondas na superfície
  const bubbles: { m: Mesh; x: number; z: number; ph: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const b = new Mesh(new SphereGeometry(0.16, 14, 10), M.glass);
    const a = i * 2.3;
    const r = 1 + (i % 4) * 1.1;
    b.renderOrder = 4;
    g.add(b);
    bubbles.push({ m: b, x: Math.cos(a) * r, z: Math.sin(a) * r, ph: i / 7 });
  }
  const ringGeo = new TorusGeometry(1, 0.02, 4, 48);
  ringGeo.rotateX(Math.PI / 2);
  const rings: { m: Mesh; mat: MeshBasicMaterial; ph: number; x: number; z: number }[] = [];
  for (let i = 0; i < 3; i++) {
    const mat = new MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false });
    const m = new Mesh(ringGeo, mat);
    m.renderOrder = 3;
    g.add(m);
    rings.push({ m, mat, ph: i / 3, x: 0, z: 0 });
  }

  // no meio, uma gota de vidro com um miolo de cromo, girando
  const drop = new Group();
  const shellB = new Mesh(new SphereGeometry(0.75, 32, 22), M.glassBack);
  const shellF = new Mesh(new SphereGeometry(0.75, 32, 22), M.glass);
  shellB.renderOrder = 3;
  shellF.renderOrder = 4;
  const core = new Mesh(new SphereGeometry(0.34, 24, 16), iridescent());
  drop.add(core, shellB, shellF);
  g.add(drop);

  let next = 0;
  return {
    group: g,
    tick: ({ t, emit }) => {
      drop.position.y = 1.7 + Math.sin(t * 0.9) * 0.22;
      core.rotation.set(t * 0.5, t * 0.7, 0);
      for (const p of pads) {
        const a = p.a + t * p.w;
        p.m.position.set(Math.cos(a) * p.r, -0.11 + Math.sin(t * 1.3 + p.a) * 0.012, Math.sin(a) * p.r);
        p.m.rotation.y = -a * 0.6;
      }
      for (const f of fish) {
        const a = f.a + t * f.w;
        f.m.position.set(Math.cos(a) * f.r, f.y + Math.sin(t * 1.7 + f.a) * 0.06, Math.sin(a) * f.r);
        f.m.rotation.y = -a + (f.w > 0 ? Math.PI : 0);
        f.tail.rotation.y = Math.sin(t * 9 + f.a) * 0.45;
      }
      for (const b of bubbles) {
        const u = (t * 0.22 + b.ph) % 1;
        b.m.position.set(b.x + Math.sin(t * 2 + b.ph * 9) * 0.12, -0.9 + u * 3.6, b.z);
        b.m.scale.setScalar(u < 0.2 ? u * 5 : u > 0.8 ? (1 - u) * 5 : 1);
      }
      for (const r of rings) {
        const u = (t * 0.32 + r.ph) % 1;
        if (u < 0.02) {
          const a = Math.random() * Math.PI * 2;
          const rr = Math.random() * (POND_R - 2);
          r.x = Math.cos(a) * rr;
          r.z = Math.sin(a) * rr;
        }
        r.m.position.set(r.x, -0.13, r.z);
        r.m.scale.setScalar(0.2 + u * 1.6);
        r.mat.opacity = (1 - u) * 0.6;
      }
      if (t > next) {
        next = t + 0.45;
        emit(g.localToWorld(new Vector3((Math.random() - 0.5) * 1.6, drop.position.y + 0.5, (Math.random() - 0.5) * 1.6)), Math.random() > 0.5 ? "#9ff3ff" : "#ffffff", 1, 0.1, 0.3);
      }
    },
  };
}

/* ---------------- O mirante ---------------- */

function lookout(): Sculpture {
  const g = new Group();
  const plinth = new Mesh(new CylinderGeometry(1.6, 1.75, 0.6, 44), M.white);
  plinth.position.y = 0.3;
  const band = new Mesh(new TorusGeometry(1.62, 0.07, 8, 56), anodized("#ff6fc8", 0.2));
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.6;
  g.add(plinth, band);

  // o anjo do DVD: corpo de cromo lilás, auréola de disco, asas de estilhaço
  const A = new Group();
  const skin = anodized("#d6c4ff", 0.14);
  const torso = new Mesh(new CapsuleGeometry(0.24, 0.5, 6, 14), skin);
  torso.position.y = 0.55;
  const head = new Mesh(new SphereGeometry(0.27, 24, 16), skin);
  head.position.y = 1.22;
  const legs = new Mesh(new CylinderGeometry(0.2, 0.05, 1.2, 16), skin);
  legs.position.y = -0.4;
  A.add(torso, head, legs, tube(v(-0.26, 0.82, 0), v(-0.85, 0.45, 0.15), 0.07, skin), tube(v(0.26, 0.82, 0), v(0.85, 0.45, 0.15), 0.07, skin));
  const halo = new Mesh(new CylinderGeometry(0.52, 0.52, 0.035, 48), iridescent());
  halo.position.y = 1.75;
  halo.rotation.x = 0.35;
  const hole = new Mesh(new CylinderGeometry(0.1, 0.1, 0.04, 24), M.ink);
  hole.position.y = 0.002;
  halo.add(hole);
  A.add(halo);
  const wingL = new Group();
  const wingR = new Group();
  const pink = anodized("#ff79d2", 0.18);
  const cyan = anodized("#7ff0ff", 0.18);
  for (let i = 0; i < 4; i++) {
    for (const [w, side] of [[wingL, -1], [wingR, 1]] as const) {
      const shard = new Mesh(new BoxGeometry(1.5 - i * 0.22, 0.14, 0.05), i % 2 ? cyan : pink);
      shard.position.set(side * (0.75 - i * 0.05), 0.15 - i * 0.2, 0);
      shard.rotation.z = side * (0.45 - i * 0.2);
      w.add(shard);
    }
  }
  wingL.position.set(-0.1, 0.85, -0.15);
  wingR.position.set(0.1, 0.85, -0.15);
  A.add(wingL, wingR);
  A.rotation.y = Math.PI / 4;
  A.scale.setScalar(1.3);
  g.add(A);

  // dois fachos de luz, como palco; à noite eles aparecem
  const beamMats: MeshBasicMaterial[] = [];
  const beams: Mesh[] = [];
  for (const [col, side] of [["#ff79d2", -1], ["#7ff0ff", 1]] as const) {
    const mat = new MeshBasicMaterial({ color: col, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false });
    const cone = new Mesh(new ConeGeometry(1.4, 7, 24, 1, true), mat);
    cone.position.set(side * 0.6, 3.6, 0);
    cone.rotation.z = side * 0.18;
    cone.renderOrder = 6;
    beamMats.push(mat);
    beams.push(cone);
    g.add(cone);
  }

  // um banco virado para a vista, e uma luneta na beirada
  const bench = new Group();
  const seat = new Mesh(new BoxGeometry(3.2, 0.14, 0.9), M.white);
  seat.position.y = 0.5;
  const back = new Mesh(new BoxGeometry(3.2, 0.7, 0.12), M.white);
  back.position.set(0, 0.95, -0.42);
  const rail = tube(v(-1.6, 1.32, -0.42), v(1.6, 1.32, -0.42), 0.05, M.chrome);
  for (const x of [-1.3, 1.3]) {
    const leg = new Mesh(new BoxGeometry(0.14, 0.45, 0.8), M.white);
    leg.position.set(x, 0.22, 0);
    bench.add(leg);
  }
  bench.add(seat, back, rail);
  bench.position.set(-5, 0, -5);
  bench.rotation.y = Math.PI / 4;
  g.add(bench);

  const scope = new Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    scope.add(tube(v(0, 1.25, 0), v(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5), 0.035, M.chrome));
  }
  const barrel = new Mesh(new CylinderGeometry(0.11, 0.2, 1.5, 18), M.chrome);
  barrel.position.y = 1.45;
  barrel.rotation.set(0.9, 0, 0);
  const eye = new Mesh(new SphereGeometry(0.12, 12, 8), M.ink);
  eye.position.set(0, -0.75, 0);
  barrel.add(eye);
  scope.add(barrel);
  scope.position.set(5.6, 0, -5.6);
  scope.rotation.y = Math.PI * 0.75;
  g.add(scope);

  let next = 0;
  return {
    group: g,
    tick: ({ t, emit, near }) => {
      A.position.y = 3.9 + Math.sin(t * 0.8) * 0.25;
      A.rotation.y = Math.PI / 4 + Math.sin(t * 0.3) * 0.35;
      wingL.rotation.z = Math.sin(t * 2.2) * 0.12;
      wingR.rotation.z = -Math.sin(t * 2.2) * 0.12;
      halo.rotation.y = t * 1.8;
      const night = U.uNight.value;
      beams.forEach((b, i) => {
        b.rotation.z = (i ? 1 : -1) * (0.18 + Math.sin(t * 0.6 + i * 2) * 0.12);
        beamMats[i].opacity = 0.05 + night * 0.16;
      });
      scope.rotation.y = Math.PI * 0.75 + Math.sin(t * 0.25) * 0.3;
      if (t > next) {
        next = t + (near > 0.5 ? 0.15 : 0.4);
        emit(g.localToWorld(new Vector3((Math.random() - 0.5) * 3, A.position.y + Math.random() * 1.6, (Math.random() - 0.5) * 3)), Math.random() > 0.5 ? "#ff9edf" : "#9ff3ff", 1, 0.1, 0.35);
      }
    },
  };
}

/* ---------------- O fliperama ---------------- */

/** uma telinha de 64×48 que se redesenha sozinha, em modo de demonstração */
function arcadeScreen(mode: number) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 48;
  const g = c.getContext("2d")!;
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  tex.generateMipmaps = false;
  const stars = Array.from({ length: 9 }, (_, i) => ({ x: (i * 23) % 60 + 2, y: (i * 37) % 48, v: 0.6 + (i % 3) * 0.4 }));
  let bx = 20, by = 20, vx = 1.3, vy = 0.9;
  const draw = (t: number) => {
    g.fillStyle = mode === 1 ? "#08101f" : "#120a2e";
    g.fillRect(0, 0, 64, 48);
    if (mode === 0) {
      // a chuva de estrelas, o jogo de verdade, jogando sozinho
      for (const s of stars) {
        s.y += s.v;
        if (s.y > 46) s.y = -2;
        g.fillStyle = s.v > 1.2 ? "#ffd23a" : s.v > 0.9 ? "#7ff0ff" : "#ff7ad9";
        g.fillRect(s.x | 0, s.y | 0, 2, 2);
      }
      const px = 32 + Math.sin(t * 1.7) * 22;
      g.fillStyle = "#dfe9ff";
      g.fillRect((px - 6) | 0, 43, 12, 2);
      g.fillStyle = "#fff";
      g.font = "bold 7px monospace";
      g.fillText(String(((t * 37) | 0) % 999).padStart(3, "0"), 2, 7);
    } else if (mode === 1) {
      // pingue-pongue
      bx += vx; by += vy;
      if (bx < 4 || bx > 58) vx = -vx;
      if (by < 2 || by > 44) vy = -vy;
      g.fillStyle = "#7ff0ff";
      g.fillRect(2, (by - 5) | 0, 2, 10);
      g.fillRect(60, (by - 5 + Math.sin(t * 3) * 3) | 0, 2, 10);
      g.fillStyle = "#fff";
      g.fillRect(bx | 0, by | 0, 2, 2);
      for (let y = 0; y < 48; y += 4) g.fillRect(31, y, 1, 2);
    } else {
      // tela de título: VON piscando sobre um campo de estrelas
      for (let i = 0; i < 20; i++) {
        const x = (i * 29 + t * 18 * ((i % 3) + 1)) % 64;
        g.fillStyle = i % 2 ? "#6e5cff" : "#ffffff";
        g.fillRect(x | 0, (i * 13) % 48, 1, 1);
      }
      if (Math.sin(t * 4) > -0.3) {
        g.fillStyle = "#ffd23a";
        g.font = "bold 13px monospace";
        g.fillText("VON", 20, 28);
      }
      g.fillStyle = "#ff7ad9";
      g.font = "6px monospace";
      g.fillText("PRESS START", 13, 40);
    }
    tex.needsUpdate = true;
  };
  return { tex, draw };
}

function cabinet(color: string, mode: number) {
  const g = new Group();
  const shell = gloss("#ffffff", { rough: 0.25 });
  const accent = gloss(color, { rough: 0.25 });
  const body = new Mesh(new BoxGeometry(1.35, 2.3, 1.1), shell);
  body.position.y = 1.15;
  const sideL = new Mesh(new BoxGeometry(0.06, 2.42, 1.16), accent);
  sideL.position.set(-0.7, 1.21, 0);
  const sideR = sideL.clone();
  sideR.position.x = 0.7;
  const marquee = new Mesh(new BoxGeometry(1.35, 0.42, 0.5), new MeshBasicMaterial({ color }));
  marquee.position.set(0, 2.5, 0.2);
  const scr = arcadeScreen(mode);
  const screen = new Mesh(new PlaneGeometry(1.05, 0.8), new MeshBasicMaterial({ map: scr.tex }));
  screen.position.set(0, 1.78, 0.56);
  screen.rotation.x = -0.18;
  const deck = new Mesh(new BoxGeometry(1.35, 0.12, 0.5), accent);
  deck.position.set(0, 1.18, 0.72);
  deck.rotation.x = 0.25;
  const stick = tube(v(-0.3, 1.24, 0.72), v(-0.3, 1.5, 0.74), 0.035, M.chrome);
  const knob = new Mesh(new SphereGeometry(0.09, 12, 8), gloss("#ff3b5c", { rough: 0.2 }));
  knob.position.set(-0.3, 1.52, 0.74);
  g.add(body, sideL, sideR, marquee, screen, deck, stick, knob);
  ["#ffd23a", "#4fd8ff"].forEach((c, i) => {
    const b = new Mesh(new CylinderGeometry(0.07, 0.07, 0.05, 14), gloss(c, { rough: 0.2 }));
    b.position.set(0.1 + i * 0.22, 1.27, 0.7);
    b.rotation.x = 0.25;
    g.add(b);
  });
  return { group: g, draw: scr.draw };
}

function arcade(): Sculpture {
  const g = new Group();
  const plinth = new Mesh(new CylinderGeometry(1.15, 1.25, 0.5, 40), M.white);
  plinth.position.y = 0.25;
  g.add(plinth);

  // uma ficha gigante, girando
  const coin = new Group();
  const gold = anodized("#ffc23a", 0.18);
  const disc = new Mesh(new CylinderGeometry(0.95, 0.95, 0.16, 48), gold);
  disc.rotation.x = Math.PI / 2;
  const rim = new Mesh(new TorusGeometry(0.95, 0.07, 10, 48), M.chrome);
  const star = new Shape();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 2;
    const r = i % 2 ? 0.18 : 0.55;
    if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  const emb = new ExtrudeGeometry(star, { depth: 0.06, bevelEnabled: false });
  emb.translate(0, 0, 0.08);
  const face = new Mesh(emb, M.chrome);
  const back = face.clone();
  back.rotation.y = Math.PI;
  coin.add(disc, rim, face, back);
  g.add(coin);

  const cabs = PLACE.arcade.cabs.map(([dx, dz], i) => {
    const c = cabinet(["#ff6fc8", "#3d5bff", "#14c3a5"][i], i);
    c.group.position.set(dx, 0, dz);
    c.group.rotation.y = Math.PI / 4 + (i === 2 ? 0.5 : 0);
    g.add(c.group);
    return c;
  });

  let tick = 0;
  return {
    group: g,
    tick: ({ t, dt, emit }) => {
      coin.position.y = 2 + Math.sin(t * 1.4) * 0.18;
      coin.rotation.y = t * 1.6;
      tick += dt;
      if (tick > 0.08) {
        tick = 0;
        cabs.forEach((c) => c.draw(t));
        if (Math.random() < 0.4) emit(g.localToWorld(new Vector3((Math.random() - 0.5) * 2, coin.position.y + 0.6, (Math.random() - 0.5) * 2)), "#ffd23a", 1, 0.1, 0.4);
      }
    },
  };
}

/* ---------------- A estante ---------------- */

function shelf(seed: number) {
  const g = new Group();
  const frame = new Mesh(new BoxGeometry(3.4, 3.1, 0.8), M.white);
  frame.position.y = 1.55;
  g.add(frame);
  const cols = ["#3d5bff", "#ff6fc8", "#14c3a5", "#ffc23a", "#7b5cff", "#ff6a2b", "#ffffff", "#4fd8ff"];
  for (let row = 0; row < 3; row++) {
    const y = 0.35 + row * 0.95;
    const cave = new Mesh(new BoxGeometry(3.1, 0.82, 0.62), standard("#cfd8e6", { rough: 0.8 }));
    cave.position.set(0, y + 0.42, 0.12);
    g.add(cave);
    let x = -1.45;
    let k = seed + row * 7;
    while (x < 1.35) {
      const w = 0.1 + ((k * 13) % 5) * 0.025;
      const h = 0.5 + ((k * 7) % 4) * 0.07;
      const book = new Mesh(new BoxGeometry(w, h, 0.42), gloss(cols[k % cols.length], { rough: 0.35 }));
      book.position.set(x + w / 2, y + h / 2 + 0.02, 0.3);
      if (k % 9 === 0) book.rotation.z = 0.18;
      g.add(book);
      x += w + 0.02;
      k++;
    }
  }
  return g;
}

function library(): Sculpture {
  const g = new Group();
  const plinth = new Mesh(new CylinderGeometry(1.25, 1.35, 0.9, 40), M.white);
  plinth.position.y = 0.45;
  g.add(plinth);

  // o livro aberto, folheando sozinho
  const book = new Group();
  const cover = gloss("#5f8cff", { rough: 0.3 });
  const paper = standard("#fffdf6", { rough: 0.7, side: DoubleSide });
  for (const side of [-1, 1]) {
    const c = new Mesh(new BoxGeometry(0.95, 0.04, 1.3), cover);
    c.position.set(side * 0.48, 0, 0);
    c.rotation.z = side * 0.18;
    const pages = new Mesh(new BoxGeometry(0.88, 0.1, 1.2), paper);
    pages.position.set(side * 0.46, 0.07, 0);
    pages.rotation.z = side * 0.18;
    book.add(c, pages);
  }
  const page = new Group();
  const leaf = new Mesh(new PlaneGeometry(0.86, 1.18), paper);
  leaf.rotation.x = -Math.PI / 2;
  leaf.position.x = 0.43;
  page.add(leaf);
  page.position.y = 0.13;
  book.add(page);
  book.position.y = 1.9;
  book.rotation.y = Math.PI / 4;
  g.add(book);

  // os quatro artigos, girando em volta como luas
  const moons = ARTICLES.map((a, i) => {
    const m = new Group();
    const b = new Mesh(new BoxGeometry(0.5, 0.7, 0.14), gloss(a.color, { rough: 0.25 }));
    const p = new Mesh(new BoxGeometry(0.44, 0.64, 0.1), paper);
    p.position.x = 0.04;
    m.add(b, p);
    g.add(m);
    return { m, a: (i / ARTICLES.length) * Math.PI * 2 };
  });

  PLACE.library.shelves.forEach(([dx, dz], i) => {
    const s = shelf(i * 11 + 3);
    s.position.set(dx, 0, dz);
    s.rotation.y = Math.abs(dx) > Math.abs(dz) ? Math.PI / 2 : 0;
    g.add(s);
  });

  return {
    group: g,
    tick: ({ t }) => {
      book.position.y = 1.9 + Math.sin(t * 1.1) * 0.12;
      // uma página vira a cada três segundos
      const u = (t % 3) / 3;
      page.rotation.z = u < 0.4 ? -(u / 0.4) * Math.PI * 0.95 : -Math.PI * 0.95;
      leaf.visible = u < 0.95;
      moons.forEach(({ m, a }, i) => {
        const ang = a + t * 0.35;
        m.position.set(Math.cos(ang) * 2.9, 2.5 + Math.sin(t * 1.3 + i) * 0.25, Math.sin(ang) * 2.9);
        m.rotation.set(Math.sin(t + i) * 0.2, -ang + Math.PI / 2, 0);
      });
    },
  };
}

/* ---------------- O jardim ---------------- */

/** areia rastelada em círculos em volta do bonsai */
function paintSand() {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  g.fillStyle = "#f1e7d0";
  g.fillRect(0, 0, S, S);
  g.strokeStyle = "rgba(150,120,80,0.28)";
  g.lineWidth = 2;
  for (let r = 34; r < 130; r += 9) {
    g.beginPath();
    g.arc(S / 2, S / 2, r, 0, Math.PI * 2);
    g.stroke();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

function garden(): Sculpture {
  const g = new Group();
  const sandMat = standard("#ffffff", { rough: 0.95 });
  sandMat.map = paintSand();
  const sand = new Mesh(new CircleGeometry(7.6, 64), sandMat);
  sand.rotation.x = -Math.PI / 2;
  sand.rotation.z = Math.PI / 4;
  sand.position.y = 0.012;
  sand.receiveShadow = true;
  g.add(sand);

  // a pedra e o bonsai de cerejeira
  const rockMat = standard("#9aa3b2", { rough: 0.55 });
  rockMat.flatShading = true;
  const rock = new Mesh(new IcosahedronGeometry(1.2, 1), rockMat);
  rock.scale.set(1.3, 0.55, 1.1);
  rock.position.y = 0.35;
  g.add(rock);
  const bark = standard("#6b4a3a", { rough: 0.7 });
  const trunk = new Mesh(new TubeGeometry(new CatmullRomCurve3([v(0, 0.5, 0), v(0.3, 1.3, 0.1), v(-0.25, 2.1, -0.1), v(0.2, 2.8, 0.15)]), 24, 0.16, 8), bark);
  g.add(trunk);
  const bloom = gloss("#ffb3d6", { rough: 0.5 });
  const crowns: Mesh[] = [];
  for (const [x, y, z, r] of [[0.2, 3, 0.15, 0.95], [-0.8, 2.4, -0.2, 0.7], [0.95, 2.2, 0.3, 0.6], [-0.1, 3.5, -0.3, 0.6]] as const) {
    const c = new Mesh(new IcosahedronGeometry(r, 1), bloom);
    c.scale.set(1.25, 0.6, 1.1);
    c.position.set(x, y, z);
    crowns.push(c);
    g.add(c);
  }

  // pedras de jardim, cada uma no seu círculo de areia
  const stone = standard("#b9c0cc", { rough: 0.5 });
  for (const [dx, dz, r] of PLACE.garden.stones) {
    const m = new Mesh(new IcosahedronGeometry(r, 1), stone);
    m.scale.set(1, 0.55, 0.9);
    m.position.set(dx, r * 0.35, dz);
    m.rotation.y = dx;
    g.add(m);
  }

  // uma lanterna de pedra que acende à noite
  const lantern = new Group();
  const lamp = new MeshBasicMaterial({ color: "#ffe2a6", transparent: true, opacity: 0.4 });
  const parts: [number, number, number][] = [[0.5, 0.2, 0.1], [0.22, 0.7, 0.55], [0.6, 0.12, 0.95]];
  for (const [w, h, y] of parts) {
    const p = new Mesh(new BoxGeometry(w, h, w), stone);
    p.position.y = y;
    lantern.add(p);
  }
  const light = new Mesh(new BoxGeometry(0.3, 0.26, 0.3), lamp);
  light.position.y = 1.18;
  const cap = new Mesh(new ConeGeometry(0.5, 0.3, 4), stone);
  cap.position.y = 1.46;
  cap.rotation.y = Math.PI / 4;
  lantern.add(light, cap);
  lantern.position.set(-6.2, 0, 2.4);
  g.add(lantern);

  let next = 0;
  return {
    group: g,
    tick: ({ t, emit }) => {
      crowns.forEach((c, i) => (c.rotation.y = Math.sin(t * 0.4 + i) * 0.06));
      lamp.opacity = 0.35 + U.uNight.value * 0.6;
      // pétalas caindo devagar
      if (t > next) {
        next = t + 0.35;
        emit(g.localToWorld(new Vector3((Math.random() - 0.5) * 2.4, 3 + Math.random(), (Math.random() - 0.5) * 2.4)), Math.random() > 0.3 ? "#ffb3d6" : "#ffffff", 1, 0.2, 0.12);
      }
    },
  };
}
