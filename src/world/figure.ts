import { CapsuleGeometry, Group, Mesh, SphereGeometry, type Material } from "three";
import { M } from "./materials";

/* ============================================================
   O boneco de cromo, separado do que ele faz. Serve ao
   visitante que você controla e aos outros visitantes da
   galeria.

   A animação é por poses: cada estado (andar, respirar, sentar,
   pular) descreve os ângulos que quer, as poses se misturam, e
   as juntas correm atrás do alvo com uma mola. Assim nenhuma
   transição precisa ser escrita à mão.

   Sinais, para quem for mexer:
   braço   x negativo leva para a frente, z para fora do corpo
   perna   x negativo leva a coxa para a frente
   canela  x positivo dobra o joelho para trás
   cabeça  x positivo olha para baixo
   ============================================================ */

export interface Pose {
  lift: number;
  lean: number;
  roll: number;
  twist: number;
  headX: number;
  headY: number;
  headZ: number;
  aLx: number; aLz: number; fLx: number; fLz: number;
  aRx: number; aRz: number; fRx: number; fRz: number;
  lLx: number; lLz: number; sLx: number;
  lRx: number; lRz: number; sRx: number;
}

const KEYS = [
  "lift", "lean", "roll", "twist", "headX", "headY", "headZ",
  "aLx", "aLz", "fLx", "fLz", "aRx", "aRz", "fRx", "fRz",
  "lLx", "lLz", "sLx", "lRx", "lRz", "sRx",
] as const;

export const rest = (): Pose => ({
  lift: 0, lean: 0, roll: 0, twist: 0, headX: 0, headY: 0, headZ: 0,
  aLx: 0, aLz: -0.14, fLx: -0.25, fLz: 0,
  aRx: 0, aRz: 0.14, fRx: -0.25, fRz: 0,
  lLx: 0, lLz: 0, sLx: 0.05,
  lRx: 0, lRz: 0, sRx: 0.05,
});

/** mistura b sobre a, com peso w, escrevendo em a */
export function blend(a: Pose, b: Partial<Pose>, w: number) {
  if (w <= 0) return a;
  for (const k of KEYS) {
    const v = b[k];
    if (v !== undefined) a[k] += (v - a[k]) * Math.min(1, w);
  }
  return a;
}

/* ---------------- poses prontas ---------------- */

/** sentado no chão, de pernas cruzadas, mãos nos joelhos */
export const SIT: Partial<Pose> = {
  lift: -0.6, lean: 0.12,
  lLx: -1.45, lLz: -0.75, sLx: 2.35, lRx: -1.45, lRz: 0.75, sRx: 2.35,
  aLx: -0.55, aLz: -0.32, fLx: -0.45, aRx: -0.55, aRz: 0.32, fRx: -0.45,
};

/** sentado numa beirada, pernas penduradas para fora */
export const SIT_EDGE: Partial<Pose> = {
  lift: -0.56, lean: -0.08,
  lLx: -1.5, lLz: -0.08, sLx: 1.45, lRx: -1.5, lRz: 0.08, sRx: 1.25,
  aLx: 0.55, aLz: -0.35, fLx: -0.1, aRx: 0.55, aRz: 0.35, fRx: -0.1,
};

/** meditando: pernas cruzadas, costas retas, mãos abertas nos joelhos */
export const LOTUS: Partial<Pose> = {
  lift: -0.6, lean: -0.02,
  lLx: -1.5, lLz: -0.85, sLx: 2.45, lRx: -1.5, lRz: 0.85, sRx: 2.45,
  aLx: -0.35, aLz: -0.45, fLx: -0.9, fLz: 0.5, aRx: -0.35, aRz: 0.45, fRx: -0.9, fRz: -0.5,
  headX: 0.12,
};

/** braços abertos, equilibrando na beirada */
export const BALANCE: Partial<Pose> = {
  aLz: -1.45, aRz: 1.45, aLx: -0.2, aRx: -0.2, fLx: -0.1, fRx: -0.1,
  headX: 0.45, lean: 0.12,
};

/** de pé, mãos para trás, olhando uma obra */
export const ADMIRE: Partial<Pose> = {
  lean: -0.04, headX: -0.12, headZ: 0.12,
  aLx: 0.42, aLz: -0.28, fLx: 0, fLz: 1.25, aRx: 0.42, aRz: 0.28, fRx: 0, fRz: -1.25,
};

/** segurando uma câmera na frente do rosto */
export const PHOTO: Partial<Pose> = {
  headX: 0.05,
  aLx: -1.15, aLz: 0.42, fLx: -1.5, aRx: -1.15, aRz: -0.42, fRx: -1.5,
};

/** braços cruzados */
export const CROSSED: Partial<Pose> = {
  aLx: -0.45, aLz: -0.1, fLx: -1.7, fLz: -0.6, aRx: -0.5, aRz: 0.1, fRx: -1.7, fRz: 0.6,
};

/* ---------------- o corpo ---------------- */

function limb(len: number, r: number, mat: Material) {
  const pivot = new Group();
  const m = new Mesh(new CapsuleGeometry(r, len, 5, 12), mat);
  m.position.y = -len / 2;
  pivot.add(m);
  return pivot;
}

export class Figure {
  /** origem nos pés */
  root = new Group();
  /** pivô no quadril: escala, giros de mortal */
  hips = new Group();
  body = new Group();
  head = new Group();
  armL: Group; armR: Group; foreL: Group; foreR: Group;
  legL: Group; legR: Group; shinL: Group; shinR: Group;
  pose: Pose = rest();

  constructor(mat: Material = M.chrome) {
    this.root.add(this.hips);
    this.hips.position.y = 0.92;
    this.hips.add(this.body);
    this.body.position.y = -0.92;

    const torso = new Mesh(new CapsuleGeometry(0.2, 0.44, 6, 14), mat);
    torso.position.y = 1.24;
    this.head.position.y = 1.62;
    const skull = new Mesh(new SphereGeometry(0.27, 28, 20), mat);
    skull.position.y = 0.26;
    this.head.add(skull);
    this.body.add(torso, this.head);

    const arm = (side: number) => {
      const up = limb(0.32, 0.085, mat);
      up.position.set(side * 0.3, 1.52, 0);
      const fore = limb(0.3, 0.078, mat);
      fore.position.y = -0.42;
      up.add(fore);
      this.body.add(up);
      return [up, fore];
    };
    [this.armL, this.foreL] = arm(-1);
    [this.armR, this.foreR] = arm(1);

    const leg = (side: number) => {
      const th = limb(0.34, 0.105, mat);
      th.position.set(side * 0.12, 0.92, 0);
      const shin = limb(0.34, 0.095, mat);
      shin.position.y = -0.46;
      th.add(shin);
      this.body.add(th);
      return [th, shin];
    };
    [this.legL, this.shinL] = leg(-1);
    [this.legR, this.shinR] = leg(1);
  }

  /** corre atrás da pose alvo; k entre 0 e 1 é o quanto andar neste quadro */
  drive(target: Pose, k: number) {
    const p = this.pose;
    for (const key of KEYS) p[key] += (target[key] - p[key]) * k;
    this.write();
  }

  /** aplica a pose atual nas juntas */
  write() {
    const p = this.pose;
    this.body.position.y = -0.92 + p.lift;
    this.body.rotation.set(p.lean, p.twist, p.roll);
    this.head.rotation.set(p.headX, p.headY, p.headZ);
    this.armL.rotation.set(p.aLx, 0, p.aLz);
    this.armR.rotation.set(p.aRx, 0, p.aRz);
    this.foreL.rotation.set(p.fLx, 0, p.fLz);
    this.foreR.rotation.set(p.fRx, 0, p.fRz);
    this.legL.rotation.set(p.lLx, 0, p.lLz);
    this.legR.rotation.set(p.lRx, 0, p.lRz);
    this.shinL.rotation.x = p.sLx;
    this.shinR.rotation.x = p.sRx;
  }
}
