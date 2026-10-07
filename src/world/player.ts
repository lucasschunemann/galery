import {
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
import { ADMIRE, BALANCE, Figure, LOTUS, SIT, blend, rest, type Pose } from "./figure";
import type { Material } from "three";

/* ============================================================
   O visitante: o boneco de cromo que você controla.

   Andando, ele balança o quadril, inclina nas curvas e a cabeça
   quica no passo. No ar, encolhe as pernas subindo e abre os
   braços caindo; um segundo pulo vira mortal. Parado, respira,
   troca o peso de perna, e depois de um tempo começa a fazer
   coisas: olhar em volta, se espreguiçar, bater o pé, olhar o
   relógio, acenar para quem está vendo. Perto de uma obra, põe
   as mãos para trás. Com a música ligada, dança. Esquecido por
   muito tempo, senta no chão.

   Segurando Shift ele vira uma bolinha de gude e rola, que é a
   homenagem ao Snaptic.
   ============================================================ */

const WALK = 6.2;
const ROLL = 13.5;
const MARBLE_R = 0.55;
const BPS = 74 / 60;

export interface Drive {
  x: number;
  z: number;
  marble: boolean;
  jump: boolean;
}

type Action = "look" | "stretch" | "tap" | "wave" | "watch";
const ACTIONS: Action[] = ["look", "stretch", "tap", "watch", "look", "wave"];
const LENGTH: Record<Action, number> = { look: 3.4, stretch: 2.6, tap: 2.8, wave: 2.2, watch: 2.4 };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const smooth = (x: number) => x * x * (3 - 2 * x);

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
  /** o mundo avisa: perto de uma obra, com a música ligada, falando com alguém */
  admiring = false;
  musicOn = false;
  lookAt: { x: number; z: number } | null = null;
  onStep: (() => void) | null = null;
  onMorph: ((toMarble: boolean) => void) | null = null;
  onJump: ((double: boolean) => void) | null = null;
  onLand: ((impact: number) => void) | null = null;
  onSit: (() => void) | null = null;

  private yaw = 0;
  private yawRate = 0;
  private yawGroup = new Group();
  private fig = new Figure();
  private target: Pose = rest();
  private marble = new Group();
  private marbleCore = new Group();
  private blob: Mesh;
  private phase = 0;
  private jumpY = 0;
  private jumpV = 0;
  private doubled = false;
  private flip = -1;
  private squash = 0;
  private landW = 0;
  private idle = 0;
  private stuck = 0;
  private rerouted = false;
  private wasMarble = false;
  private lastStep = 0;
  private faceYaw: number | null = null;
  private action: { name: Action; start: number } | null = null;
  private nextAction = 3.5;
  private actionN = 0;
  private sitW = 0;
  private sat = false;
  private now = 0;
  private danceUntil = -1;
  private forceSit = false;
  private edgeW = 0;
  private flipDur = 0.62;
  /** meditando: senta de pernas cruzadas e flutua um pouco */
  meditating = false;

  constructor() {
    this.root.add(this.yawGroup, this.marble);
    this.yawGroup.add(this.fig.root);

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

  /** acena para quem está vendo */
  hello() {
    this.action = { name: "wave", start: -1 };
  }

  /** os gestos das teclas 1 a 4 */
  emote(name: "wave" | "dance" | "sit" | "stretch") {
    if (this.airborne || this.morph > 0.5) return;
    if (name === "wave") return this.hello();
    if (name === "dance") { this.danceUntil = this.now + 6; this.forceSit = false; return; }
    if (name === "sit") { this.forceSit = !this.forceSit; return; }
    this.action = { name: "stretch", start: -1 };
  }

  /** a plataforma de salto: um pulo alto, com mortal lento */
  launch(v = 14) {
    this.jumpV = v;
    this.doubled = true;
    this.flip = 0;
    this.flipDur = 0.95;
    this.wakeUp();
  }

  private riding = false;
  get isRiding() { return this.riding; }

  /** dentro do tubo: o mundo empurra a bolinha pela curva, e ela gira na direção do movimento */
  ride(p: Vector3, dir: Vector3, speed: number, dt: number) {
    this.riding = true;
    this.morph = 1;
    this.wasMarble = true;
    this.path = [];
    this.pos.copy(p);
    this.root.position.set(p.x, p.y - MARBLE_R, p.z);
    this.blob.visible = false;
    this.fig.root.visible = false;
    this.marble.visible = true;
    this.marble.scale.setScalar(1);
    this.speed = speed;
    const axis = new Vector3(dir.z, 0, -dir.x);
    if (axis.lengthSq() < 1e-6) axis.set(1, 0, 0);
    axis.normalize();
    this.marbleCore.quaternion.premultiply(new Quaternion().setFromAxisAngle(axis, (speed * dt) / MARBLE_R));
  }

  /** saiu do tubo: cai do lado da boca com um pulinho, e volta a ser boneco se ninguém segurar Shift */
  leave(x: number, z: number, yaw: number) {
    this.riding = false;
    this.blob.visible = true;
    this.place(x, z, yaw);
    this.speed = 0;
    this.launch(6.5);
  }

  /** altura do pulo, para a câmera acompanhar */
  get height() { return this.jumpY; }

  /** troca o material do corpo inteiro (a pele dourada) */
  skin(mat: Material) {
    this.fig.root.traverse((o) => {
      const m = o as unknown as { isMesh?: boolean; material: Material };
      if (m.isMesh) m.material = mat;
    });
  }

  /** vira para um ponto quando estiver parado */
  face(x: number, z: number) {
    this.faceYaw = Math.atan2(x - this.pos.x, z - this.pos.z);
  }

  get moving() { return this.speed > 0.4 || this.path.length > 0; }
  get airborne() { return this.jumpY > 0.001 || this.jumpV > 0; }

  update(dt: number, t: number, d: Drive) {
    this.now = t;
    const wantMarble = d.marble || this.autoMarble;
    const target = wantMarble ? 1 : 0;
    this.morph += Math.sign(target - this.morph) * Math.min(Math.abs(target - this.morph), dt * 3.2);
    const isMarble = this.morph > 0.5;
    if (isMarble !== this.wasMarble) {
      this.wasMarble = isMarble;
      this.onMorph?.(isMarble);
    }
    const mk = smooth(this.morph);
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

    // sentado demora um instante para levantar antes de sair andando
    if (this.sitW > 0.35 && (dx || dz)) {
      dx *= 0.15;
      dz *= 0.15;
    }

    const following = steer <= 0.01 && this.path.length > 0;
    const acc = 1 - Math.exp(-dt * (isMarble ? (following ? 7 : 3.5) : this.airborne ? 6 : 11));
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

    // pulo, e um segundo pulo no ar que vira mortal
    if (d.jump) {
      if (!this.airborne) {
        this.jumpV = isMarble ? 6 : 7.4;
        this.doubled = false;
        this.wakeUp();
        this.onJump?.(false);
      } else if (!this.doubled) {
        this.jumpV = isMarble ? 6.5 : 8.2;
        this.doubled = true;
        this.flipDur = 0.62;
        if (!isMarble) this.flip = 0;
        this.onJump?.(true);
      }
    }
    if (this.jumpV !== 0 || this.jumpY > 0) {
      this.jumpY += this.jumpV * dt;
      this.jumpV -= 24 * dt;
      if (this.flip >= 0) this.flip = Math.min(1, this.flip + dt / this.flipDur);
      if (this.jumpY <= 0) {
        const impact = Math.min(1, -this.jumpV / 8);
        this.jumpY = 0;
        this.jumpV = 0;
        this.flip = -1;
        this.squash = impact;
        this.landW = Math.min(1, 0.4 + impact);
        this.onLand?.(impact);
      }
    }
    this.squash = Math.max(0, this.squash - dt * 5);
    this.landW = Math.max(0, this.landW - dt * 4.5);

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
      this.wakeUp();
    } else {
      this.idle += dt;
      want = this.faceYaw;
    }
    // acenar é para a câmera, que fica a 45° de quem olha para +z
    if (this.action?.name === "wave" && moved < 0.3) want = Math.PI / 4;
    const before = this.yaw;
    if (want !== null) {
      let diff = want - this.yaw;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.yaw += diff * Math.min(1, dt * 10);
    }
    this.yawRate += ((this.yaw - before) / Math.max(dt, 1e-4) - this.yawRate) * Math.min(1, dt * 8);
    this.yawGroup.rotation.y = this.yaw;

    // parado de frente para o vazio: abre os braços e se equilibra
    const ahead = moved < 0.3 && !this.airborne && !walkable(this.pos.x + Math.sin(this.yaw) * 1.1, this.pos.z + Math.cos(this.yaw) * 1.1);
    this.edgeW += ((ahead ? 1 : 0) - this.edgeW) * Math.min(1, dt * 3);

    this.animate(dt, t, moved, mk);
  }

  private wakeUp() {
    this.idle = 0;
    if (this.action?.name !== "wave") this.action = null;
    this.nextAction = 3 + Math.random() * 2.5;
    this.sat = false;
    this.forceSit = false;
    this.meditating = false;
    this.danceUntil = -1;
  }

  private animate(dt: number, t: number, speed: number, mk: number) {
    const air = this.airborne;
    const amp = air ? 0 : Math.min(1, speed / WALK);
    this.phase += dt * speed * 1.55;
    const s = Math.sin(this.phase);
    const c = Math.cos(this.phase);
    const P = Object.assign(this.target, rest());

    // parado: respira e passa o peso de uma perna para a outra
    const br = Math.sin(t * 2.1);
    const shift = Math.sin(t * 0.55);
    P.lift = br * 0.012 - Math.abs(shift) * 0.012;
    P.roll = shift * 0.035;
    P.lLz = -0.03 + shift * 0.03;
    P.lRz = 0.03 + shift * 0.03;
    P.sLx = 0.05 + Math.max(0, shift) * 0.12;
    P.sRx = 0.05 + Math.max(0, -shift) * 0.12;
    P.aLz = -0.13 - br * 0.015;
    P.aRz = 0.13 + br * 0.015;
    P.headX = br * 0.02;

    // andando
    if (amp > 0.02) {
      blend(P, {
        lLx: -s * 0.8, lRx: s * 0.8,
        sLx: Math.max(0, Math.sin(this.phase + 1.1)) * 1.1 + 0.08,
        sRx: Math.max(0, Math.sin(this.phase + 1.1 + Math.PI)) * 1.1 + 0.08,
        lLz: 0, lRz: 0,
        aLx: s * 0.72, aRx: -s * 0.72, aLz: -0.2, aRz: 0.2, fLx: -0.5, fRx: -0.5,
        lift: Math.abs(c) * 0.08 - 0.035,
        lean: 0.14,
        twist: s * 0.16,
        headX: -0.08 + Math.abs(c) * 0.05,
        headY: -s * 0.08,
        roll: clamp(-this.yawRate * 0.07, -0.32, 0.32),
      }, amp);
    }

    // parado de verdade: as ações, a obra, a música, sentar
    const still = !air && amp < 0.05;
    if (still) {
      const sitting = (this.idle > 18 && !this.musicOn && !this.admiring) || this.forceSit || this.meditating;
      if (sitting && !this.sat) { this.sat = true; this.onSit?.(); }
      this.sitW += ((sitting ? 1 : 0) - this.sitW) * Math.min(1, dt * 2.2);
      const dancing = !sitting && ((this.musicOn && this.idle > 2.5) || t < this.danceUntil);

      if (dancing) {
        // dança no tempo da música
        const b = t * Math.PI * BPS;
        const bob = Math.abs(Math.sin(b));
        blend(P, {
          lift: -0.06 + bob * 0.07,
          lLx: -0.12, lRx: -0.12, sLx: 0.3 - bob * 0.2, sRx: 0.3 - bob * 0.2,
          aLx: -0.9 + Math.sin(b) * 0.55, aRx: -0.9 - Math.sin(b) * 0.55, fLx: -1.5, fRx: -1.5, aLz: -0.35, aRz: 0.35,
          twist: Math.sin(b * 0.5) * 0.32,
          roll: Math.sin(b * 0.5) * 0.08,
          headX: 0.12 - bob * 0.18,
          headZ: Math.sin(b * 0.5) * 0.15,
        }, t < this.danceUntil ? 1 : Math.min(1, (this.idle - 2.5) * 2));
      } else if (this.admiring && this.idle > 1.2) {
        const tilt = Math.sin(t * 0.45);
        blend(P, { ...ADMIRE, headZ: 0.1 + tilt * 0.12, headX: -0.12 + Math.max(0, Math.sin(t * 0.9)) * 0.08 }, Math.min(1, (this.idle - 1.2) * 1.5));
      } else if (!sitting) {
        this.actions(t, P);
      }

      if (this.sitW > 0.01) {
        if (this.meditating) {
          const breath = Math.sin(t * (Math.PI / 4));
          blend(P, { ...LOTUS, lift: (LOTUS.lift ?? 0) + 0.28 + breath * 0.06, lean: breath * 0.03, headX: 0.15 - breath * 0.05 }, this.sitW);
        } else {
          blend(P, { ...SIT, headY: Math.sin(t * 0.35) * 0.55, headX: 0.06 + Math.sin(t * 0.21) * 0.08, roll: Math.sin(t * 0.5) * 0.05 }, this.sitW);
        }
      }
      if (this.edgeW > 0.01 && !sitting && !dancing) {
        blend(P, { ...BALANCE, roll: Math.sin(t * 3.4) * 0.16, aLz: -1.45 + Math.sin(t * 3.4) * 0.2, aRz: 1.45 + Math.sin(t * 3.4) * 0.2 }, this.edgeW);
      }
    } else {
      this.sitW = Math.max(0, this.sitW - dt * 3);
      if (this.sitW > 0.01) blend(P, SIT, this.sitW);
    }
    if (this.action?.name === "wave" && !air) this.actions(t, P);

    // no ar: encolhe subindo, abre os braços caindo; no mortal, vira bola
    if (air) {
      blend(P, {
        lLx: -0.25, sLx: 0.45, lRx: 0.12, sRx: 0.25, lLz: -0.14, lRz: 0.14,
        aLx: -0.45, aRx: -0.45, aLz: -1.35, aRz: 1.35, fLx: -0.35, fRx: -0.35,
        headX: 0.25, lean: 0.06, lift: 0,
      }, 1);
      const up = clamp(this.jumpV / 6 + 0.35, 0, 1);
      blend(P, {
        lLx: -1.05, sLx: 1.6, lRx: -0.55, sRx: 1.1,
        aLx: -2.55, aRx: -2.35, aLz: -0.35, aRz: 0.35, fLx: -0.2, fRx: -0.2,
        lean: -0.08, headX: -0.28,
      }, up);
      if (this.flip >= 0) {
        blend(P, { lLx: -2.1, sLx: 2.4, lRx: -2.1, sRx: 2.4, aLx: -1.2, aRx: -1.2, fLx: -1.9, fRx: -1.9, aLz: -0.3, aRz: 0.3, headX: 0.5, lean: 0.2 }, Math.sin(this.flip * Math.PI) * 1.4);
      }
    }

    // aterrissagem: dobra os joelhos e absorve
    if (this.landW > 0) {
      blend(P, { lift: -0.24, lLx: -0.75, sLx: 1.4, lRx: -0.75, sRx: 1.4, lean: 0.28, aLx: -0.55, aRx: -0.55, aLz: -0.5, aRz: 0.5, headX: 0.12 }, smooth(this.landW));
    }

    // conversando: a cabeça vira para quem fala
    if (this.lookAt) {
      const want = Math.atan2(this.lookAt.x - this.pos.x, this.lookAt.z - this.pos.z) - this.yaw;
      const rel = Math.atan2(Math.sin(want), Math.cos(want));
      blend(P, { headY: clamp(rel, -1.15, 1.15), headX: -0.06 }, 0.85);
    }

    // passos, para o som
    if (amp > 0.3) {
      const step = Math.floor((this.phase + Math.PI / 2) / Math.PI);
      if (step !== this.lastStep) { this.lastStep = step; this.steps++; this.onStep?.(); }
    }

    const rate = air ? 16 : amp > 0.05 ? 20 : 8;
    this.fig.drive(P, 1 - Math.exp(-dt * rate));

    // mortal: o quadril gira uma volta inteira
    const hips = this.fig.hips;
    hips.rotation.x = this.flip >= 0 ? smooth(this.flip) * Math.PI * 2 : 0;

    // boneco ↔ bolinha, com um amassadinho quando cai de um pulo
    const fig = Math.max(0, 1 - mk * 1.6);
    const sq = Math.sin(this.squash * Math.PI) * 0.16;
    const stretch = air && this.flip < 0 ? clamp(Math.abs(this.jumpV) / 60, 0, 0.1) : 0;
    hips.scale.set(fig * (1 + sq - stretch * 0.5), fig * (1 - sq + stretch), fig * (1 + sq - stretch * 0.5));
    this.fig.root.visible = fig > 0.01;
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

  /** a fila de coisinhas que ele faz quando fica parado */
  private actions(t: number, P: Pose) {
    if (!this.action && this.idle > this.nextAction) {
      this.action = { name: ACTIONS[this.actionN++ % ACTIONS.length], start: t };
    }
    const a = this.action;
    if (!a) return;
    if (a.start < 0) a.start = t;
    const u = (t - a.start) / LENGTH[a.name];
    if (u >= 1) {
      this.action = null;
      this.nextAction = this.idle + 2.5 + Math.random() * 3;
      return;
    }
    const w = Math.min(1, u * 5, (1 - u) * 4);
    const lt = t - a.start;
    switch (a.name) {
      case "look":
        blend(P, { headY: Math.sin(u * Math.PI * 2) * 0.95, headX: -0.1, twist: Math.sin(u * Math.PI * 2) * 0.18 }, w);
        break;
      case "stretch":
        blend(P, {
          aLx: -2.95, aRx: -2.95, aLz: -0.28, aRz: 0.28, fLx: -0.05, fRx: -0.05,
          lean: -0.14, lift: 0.05 + Math.sin(lt * 3) * 0.015, headX: -0.3,
          roll: Math.sin(lt * 2.4) * 0.08,
        }, w);
        break;
      case "tap": {
        const tap = Math.max(0, Math.sin(lt * 13));
        blend(P, {
          lRx: -0.3 - tap * 0.12, sRx: 0.35, lRz: 0.06,
          aLx: 0.1, aLz: -0.85, fLx: -0.2, fLz: 1.9, aRx: 0.1, aRz: 0.85, fRx: -0.2, fRz: -1.9,
          headZ: Math.sin(lt * 6.5) * 0.08, headY: 0.25, roll: -0.05,
        }, w);
        break;
      }
      case "watch":
        blend(P, { aLx: -1.35, aLz: 0.2, fLx: -1.45, fLz: 0.35, headX: 0.38, headY: -0.32, twist: -0.1 }, w);
        break;
      case "wave":
        blend(P, {
          aRx: -0.1, aRz: 2.55, fRx: -0.15, fRz: Math.sin(lt * 13) * 0.55,
          headZ: -0.14, headX: -0.08, roll: 0.04,
        }, w);
        break;
    }
  }
}
