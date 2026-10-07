import {
  CapsuleGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from "three";
import { M, anodized } from "./materials";
import { groundY, pushOut, route, walkable } from "./layout";
import { paintBlob } from "./sign";
import { shadowed } from "./geo";

/* ============================================================
   O visitante: um boneco de cromo, cabeça de esfera, membros
   de cápsula. Segurando Shift ele vira uma bolinha de gude e
   rola, que é a homenagem ao Snaptic.
   ============================================================ */

const WALK = 6.2;
const ROLL = 13.5;
const MARBLE_R = 0.55;

function limb(len: number, r: number) {
  const pivot = new Group();
  const m = new Mesh(new CapsuleGeometry(r, len, 5, 12), M.chrome);
  m.position.y = -len / 2;
  pivot.add(m);
  return pivot;
}

export interface Drive {
  x: number;
  z: number;
  marble: boolean;
  jump: boolean;
}

export class Player {
  root = new Group();
  pos = new Vector3();
  vel = new Vector2();
  path: { x: number; z: number }[] = [];
  onArrive: (() => void) | null = null;
  autoMarble = false;
  /** 0 boneco, 1 bolinha */
  morph = 0;
  speed = 0;
  steps = 0;
  onStep: (() => void) | null = null;
  onMorph: ((toMarble: boolean) => void) | null = null;
  onJump: (() => void) | null = null;
  onLand: ((impact: number) => void) | null = null;

  private yaw = 0;
  private yawGroup = new Group();
  private figure = new Group();
  private body = new Group();
  private head: Mesh;
  private armL: Group;
  private armR: Group;
  private foreL: Group;
  private foreR: Group;
  private legL: Group;
  private legR: Group;
  private shinL: Group;
  private shinR: Group;
  private marble = new Group();
  private marbleCore = new Group();
  private blob: Mesh;
  private phase = 0;
  private jumpY = 0;
  private jumpV = 0;
  private squash = 0;
  private wave = 0;
  private idle = 0;
  private stuck = 0;
  private rerouted = false;
  private wasMarble = false;
  private lastStep = 0;
  private faceYaw: number | null = null;

  constructor() {
    this.root.add(this.yawGroup, this.marble);
    this.yawGroup.add(this.figure);
    this.figure.position.y = 0.92;
    this.figure.add(this.body);
    this.body.position.y = -0.92;

    const torso = new Mesh(new CapsuleGeometry(0.2, 0.44, 6, 14), M.chrome);
    torso.position.y = 1.24;
    this.head = new Mesh(new SphereGeometry(0.27, 28, 20), M.chrome);
    this.head.position.y = 1.88;
    this.body.add(torso, this.head);

    const arm = (side: number) => {
      const up = limb(0.32, 0.085);
      up.position.set(side * 0.3, 1.52, 0);
      up.rotation.z = side * 0.14;
      const fore = limb(0.3, 0.078);
      fore.position.y = -0.42;
      up.add(fore);
      this.body.add(up);
      return [up, fore];
    };
    [this.armL, this.foreL] = arm(-1);
    [this.armR, this.foreR] = arm(1);

    const leg = (side: number) => {
      const th = limb(0.34, 0.105);
      th.position.set(side * 0.12, 0.92, 0);
      const shin = limb(0.34, 0.095);
      shin.position.y = -0.46;
      th.add(shin);
      this.body.add(th);
      return [th, shin];
    };
    [this.legL, this.shinL] = leg(-1);
    [this.legR, this.shinR] = leg(1);

    // a bolinha: casca de vidro, miolo cromado, uma faixa para ver o giro
    const shellB = new Mesh(new SphereGeometry(MARBLE_R, 32, 22), M.glassBack);
    const shellF = new Mesh(new SphereGeometry(MARBLE_R, 32, 22), M.glass);
    shellB.renderOrder = 3;
    shellF.renderOrder = 4;
    const core = new Mesh(new SphereGeometry(0.3, 24, 16), M.chrome);
    const band = new Mesh(new TorusGeometry(0.38, 0.06, 10, 36), anodized("#ff5fbf", 0.18));
    const band2 = new Mesh(new TorusGeometry(0.38, 0.045, 10, 36), anodized("#4fd8ff", 0.18));
    band2.rotation.y = Math.PI / 2;
    this.marbleCore.add(core, band, band2);
    this.marble.add(this.marbleCore, shellB, shellF);
    this.marble.position.y = MARBLE_R;
    this.marble.scale.setScalar(0.001);
    this.marble.visible = false;

    this.blob = new Mesh(
      new PlaneGeometry(1.5, 1.5),
      new MeshBasicMaterial({ map: paintBlob(), color: "#1a1640", transparent: true, opacity: 0.32, depthWrite: false }),
    );
    this.blob.rotation.x = -Math.PI / 2;
    this.blob.renderOrder = 1;

    shadowed(this.yawGroup, true, false);
    shadowed(this.marbleCore, true, false);
  }

  /** a mancha de contato fica fora do root, para não pular junto */
  get contact() { return this.blob; }

  place(x: number, z: number, yaw = Math.PI / 4) {
    this.pos.set(x, groundY(x, z), z);
    this.yaw = yaw;
    this.vel.set(0, 0);
    this.path = [];
  }

  goTo(x: number, z: number, onArrive: (() => void) | null = null) {
    this.path = route(this.pos.x, this.pos.z, x, z);
    this.onArrive = onArrive;
    this.stuck = 0;
  }

  stop() {
    this.path = [];
    this.onArrive = null;
    this.autoMarble = false;
  }

  hello() { this.wave = 2.2; }

  /** vira para um ponto quando estiver parado */
  face(x: number, z: number) {
    this.faceYaw = Math.atan2(x - this.pos.x, z - this.pos.z);
  }

  get moving() { return this.speed > 0.4 || this.path.length > 0; }

  update(dt: number, t: number, d: Drive) {
    const wantMarble = d.marble || this.autoMarble;
    const target = wantMarble ? 1 : 0;
    this.morph += Math.sign(target - this.morph) * Math.min(Math.abs(target - this.morph), dt * 3.2);
    const isMarble = this.morph > 0.5;
    if (isMarble !== this.wasMarble) {
      this.wasMarble = isMarble;
      this.onMorph?.(isMarble);
    }
    const mk = this.morph * this.morph * (3 - 2 * this.morph);
    const maxSpeed = WALK + (ROLL - WALK) * mk;

    let dx = 0;
    let dz = 0;
    const steer = Math.hypot(d.x, d.z);
    if (steer > 0.01) {
      if (this.path.length) this.stop();
      dx = (d.x / Math.max(1, steer)) * maxSpeed;
      dz = (d.z / Math.max(1, steer)) * maxSpeed;
    } else if (this.path.length) {
      const wp = this.path[0];
      const ex = wp.x - this.pos.x;
      const ez = wp.z - this.pos.z;
      const dist = Math.hypot(ex, ez);
      const last = this.path.length === 1;
      if (dist < (last ? 0.18 : 0.5)) {
        this.path.shift();
        if (!this.path.length) {
          const cb = this.onArrive;
          this.onArrive = null;
          this.autoMarble = false;
          cb?.();
        }
      } else {
        let k = last ? Math.min(1, dist / (1 + mk * 2)) : 1;
        if (!last) {
          // freia antes de uma curva fechada, para não sair da ponte
          const nx = this.path[1].x - wp.x;
          const nz = this.path[1].z - wp.z;
          const cos = ((ex / dist) * nx + (ez / dist) * nz) / Math.max(1e-4, Math.hypot(nx, nz));
          if (cos < 0.9) k = Math.min(1, Math.max(0.28, dist / (2.5 + mk * 3)));
        }
        dx = (ex / dist) * maxSpeed * k;
        dz = (ez / dist) * maxSpeed * k;
      }
    }

    const following = steer <= 0.01 && this.path.length > 0;
    const acc = 1 - Math.exp(-dt * (isMarble ? (following ? 7 : 3.5) : 11));
    this.vel.x += (dx - this.vel.x) * acc;
    this.vel.y += (dz - this.vel.y) * acc;

    // anda com colisão: tenta o passo inteiro, depois só x, depois só z
    const ox = this.pos.x;
    const oz = this.pos.z;
    const nx = ox + this.vel.x * dt;
    const nz = oz + this.vel.y * dt;
    const p = { x: nx, z: nz };
    pushOut(p);
    if (walkable(p.x, p.z)) { this.pos.x = p.x; this.pos.z = p.z; }
    else if (walkable(nx, oz)) { this.pos.x = nx; this.vel.y *= 0.5; }
    else if (walkable(ox, nz)) { this.pos.z = nz; this.vel.x *= 0.5; }
    else this.vel.set(0, 0);

    const moved = Math.hypot(this.pos.x - ox, this.pos.z - oz) / Math.max(dt, 1e-4);
    this.speed = moved;
    if (this.path.length && moved < 0.3) {
      this.stuck += dt;
      if (this.stuck > 2.2) this.stop();
      else if (this.stuck > 0.8 && !this.rerouted) {
        // empacou: recalcula a rota até o fim, uma vez
        const end = this.path[this.path.length - 1];
        this.path = route(this.pos.x, this.pos.z, end.x, end.z);
        this.rerouted = true;
      }
    } else {
      this.stuck = 0;
      this.rerouted = false;
    }

    // pulo
    if (d.jump && this.jumpY <= 0.001) {
      this.jumpV = isMarble ? 6 : 7.2;
      this.onJump?.();
    }
    if (this.jumpV !== 0 || this.jumpY > 0) {
      this.jumpY += this.jumpV * dt;
      this.jumpV -= 24 * dt;
      if (this.jumpY <= 0) {
        const impact = Math.min(1, -this.jumpV / 8);
        this.jumpY = 0;
        this.jumpV = 0;
        this.squash = impact;
        this.onLand?.(impact);
      }
    }
    this.squash = Math.max(0, this.squash - dt * 5);

    const gy = groundY(this.pos.x, this.pos.z);
    this.pos.y = gy;
    this.root.position.set(this.pos.x, gy + this.jumpY, this.pos.z);
    this.blob.position.set(this.pos.x, gy + 0.02, this.pos.z);
    const bs = 1 / (1 + this.jumpY * 0.5);
    this.blob.scale.setScalar(bs * (0.85 + mk * 0.1));

    let want: number | null = null;
    if (moved > 0.3) {
      want = Math.atan2(this.vel.x, this.vel.y);
      this.faceYaw = null;
      this.idle = 0;
    } else {
      this.idle += dt;
      want = this.faceYaw;
    }
    if (want !== null) {
      let diff = want - this.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.yaw += diff * Math.min(1, dt * 10);
    }
    this.yawGroup.rotation.y = this.yaw;

    this.animate(dt, t, moved, mk);
  }

  private animate(dt: number, t: number, speed: number, mk: number) {
    const amp = Math.min(1, speed / WALK);
    this.phase += dt * speed * 1.55;
    const s = Math.sin(this.phase);
    const c = Math.cos(this.phase);

    this.legL.rotation.x = -s * 0.7 * amp;
    this.legR.rotation.x = s * 0.7 * amp;
    this.shinL.rotation.x = Math.max(0, Math.sin(this.phase + 1.1)) * 1.0 * amp + 0.05;
    this.shinR.rotation.x = Math.max(0, Math.sin(this.phase + 1.1 + Math.PI)) * 1.0 * amp + 0.05;
    this.armL.rotation.x = s * 0.6 * amp;
    this.armR.rotation.x = -s * 0.6 * amp;
    this.foreL.rotation.x = -0.25 - amp * 0.35;
    this.foreR.rotation.x = -0.25 - amp * 0.35;

    // passos, para o som
    if (amp > 0.3) {
      const step = Math.floor((this.phase + Math.PI / 2) / Math.PI);
      if (step !== this.lastStep) { this.lastStep = step; this.steps++; this.onStep?.(); }
    }

    const breathe = Math.sin(t * 2) * 0.012 * (1 - amp);
    this.body.position.y = -0.92 + Math.abs(c) * 0.07 * amp + breathe;
    this.body.rotation.x = amp * 0.12;
    this.armR.rotation.z = 0.14;
    this.armL.rotation.z = -0.14;
    this.foreR.rotation.z = 0;

    // o aceno
    if (this.wave > 0) {
      this.wave -= dt;
      const k = Math.min(1, this.wave * 2, (2.2 - this.wave) * 4);
      this.armR.rotation.z = 0.14 + k * 2.5;
      this.armR.rotation.x = 0;
      this.foreR.rotation.z = k * Math.sin(t * 14) * 0.5;
      this.foreR.rotation.x = -0.2 * k;
    }

    // parado há um tempo: olha em volta
    this.head.rotation.y = this.idle > 4 ? Math.sin(t * 0.7) * 0.6 : 0;

    // boneco ↔ bolinha, com um amassadinho quando cai de um pulo
    const fig = Math.max(0, 1 - mk * 1.6);
    const sq = Math.sin(this.squash * Math.PI) * 0.16;
    this.figure.scale.set(fig * (1 + sq), fig * (1 - sq), fig * (1 + sq));
    this.figure.visible = fig > 0.01;
    const pop = Math.max(0, (mk - 0.25) / 0.75);
    const over = pop < 1 ? pop * (1 + Math.sin(pop * Math.PI) * 0.35) : 1;
    this.marble.scale.setScalar(Math.max(0.001, over));
    this.marble.visible = pop > 0.001;
    if (this.marble.visible && this.speed > 0.05) {
      const axis = new Vector3(this.vel.y, 0, -this.vel.x).normalize();
      const q = new Quaternion().setFromAxisAngle(axis, (this.speed * dt) / MARBLE_R);
      this.marbleCore.quaternion.premultiply(q);
    }
  }
}
