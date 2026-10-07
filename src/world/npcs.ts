import {
  CanvasTexture,
  MeshBasicMaterial,
  NearestFilter,
  PlaneGeometry,
  SRGBColorSpace,
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  Mesh,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type Object3D,
} from "three";
import { Figure, LOTUS, PHOTO, SIT_EDGE, blend, rest } from "./figure";
import { M, anodized, standard } from "./materials";
import { OBSTACLES, PLACE, POND_R, zoneById } from "./layout";
import { shadowed, tube, v } from "./geo";

/* ============================================================
   Quem mais está na galeria. Outros visitantes de cromo, cada
   um de uma cor; um urso de fone e óculos escuros na lagoa; o
   anjo do mirante; a colher atrás da colina. Chegando perto,
   eles falam. Cada um tem a sua voz, que é só uma altura de
   nota diferente nos bipes.
   ============================================================ */

export interface Npc {
  id: string;
  name: string;
  /** nota base da voz, em MIDI */
  voice: number;
  x: number;
  z: number;
  reach: number;
  anchor: Vector3;
  lines: string[];
  object?: Object3D;
  tick?: (t: number, dt: number, talk: number, player: Vector3) => void;
  /** um botão no balão: o que acontece quando você aceita o convite */
  action?: { id: "tour" | "play" | "read" | "breathe"; label: string };
}

const BPS = 74 / 60;
/** quanto a cabeça precisa girar para olhar para o visitante */
const headTo = (yaw: number, px: number, pz: number, x: number, z: number) => {
  const want = Math.atan2(px - x, pz - z) - yaw;
  return Math.max(-1.1, Math.min(1.1, Math.atan2(Math.sin(want), Math.cos(want))));
};

/* ---------------- visitantes ---------------- */

function visitor(color: string) {
  const f = new Figure(anodized(color, 0.16));
  shadowed(f.root, true, false);
  return f;
}

/** sentado na beirada da ponte, balançando as pernas */
function sitter(): Npc {
  const x = 1.12;
  const z = -15;
  const yaw = Math.PI / 2;
  const f = visitor("#ffb6e1");
  f.root.position.set(x, -0.2, z);
  f.root.rotation.y = yaw;
  OBSTACLES.push({ x: x - 0.1, z, r: 0.45 });
  return {
    id: "sentado", name: "Visitante", voice: 64, x, z, reach: 3.4,
    anchor: new Vector3(x, 2.1, z),
    lines: [
      "Daqui dá pra ver quase tudo.",
      "Já foi na colina? Tem alguém morando atrás dela.",
      "Eu venho aqui pensar um pouco. As nuvens ajudam.",
    ],
    object: f.root,
    tick: (t, dt, talk, p) => {
      const P = blend(rest(), SIT_EDGE, 1);
      P.sLx += Math.sin(t * 2.2) * 0.35;
      P.sRx += Math.sin(t * 2.2 + 2.4) * 0.35;
      P.headY = talk > 0 ? headTo(yaw, p.x, p.z, x, z) : Math.sin(t * 0.3) * 0.5;
      P.headX = talk > 0 ? -0.05 : 0.15 + Math.sin(t * 0.5) * 0.08;
      if (talk > 0) blend(P, { aRx: -0.4, aRz: 1.1, fRz: Math.sin(t * 9) * 0.3 }, Math.min(1, talk) * (Math.sin(t * 0.8) > 0.6 ? 1 : 0));
      f.drive(P, 1 - Math.exp(-dt * 7));
    },
  };
}

/** em frente ao cubo do Acronos, tirando foto */
function photographer(): Npc {
  const zn = zoneById("acronos")!;
  const x = zn.focus.x + 3.6;
  const z = zn.focus.z + 0.3;
  const yaw = Math.atan2(zn.focus.x - x, zn.focus.z - z);
  const f = visitor("#8ff0d6");
  f.root.position.set(x, 0, z);
  f.root.rotation.y = yaw;
  const cam = new Group();
  const box = new Mesh(new BoxGeometry(0.34, 0.22, 0.14), M.ink);
  const lens = new Mesh(new CylinderGeometry(0.07, 0.08, 0.12, 14), M.chrome);
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.12;
  cam.add(box, lens);
  cam.position.set(0, 1.42, 0.42);
  f.body.add(cam);
  OBSTACLES.push({ x, z, r: 0.5 });
  let flash = 0;
  return {
    id: "fotografa", name: "Fotógrafa", voice: 69, x, z, reach: 3.4,
    anchor: new Vector3(x, 2.4, z),
    lines: [
      "Fica paradinho, vou fotografar o cubo.",
      "Ele nunca fica igual duas vezes. Já tenho umas duzentas fotos.",
      "Contei 27 peças. Acho.",
    ],
    object: f.root,
    tick: (t, dt, talk, p) => {
      const P = rest();
      const shoot = (t % 6) < 3.4 && talk <= 0;
      blend(P, PHOTO, shoot ? 1 : 0);
      P.headY = talk > 0 ? headTo(yaw, p.x, p.z, x, z) : 0;
      P.lean = shoot ? 0.08 : 0;
      P.lift = Math.sin(t * 2) * 0.01;
      // o clique, com o flash
      const k = Math.floor(t / 6);
      if (shoot && (t % 6) > 2.2 && flash !== k) {
        flash = k;
        cam.scale.setScalar(1.25);
      }
      cam.scale.lerp(new Vector3(1, 1, 1), Math.min(1, dt * 8));
      cam.visible = P.aLx < -0.5;
      f.drive(P, 1 - Math.exp(-dt * 6));
    },
  };
}

/** no banco do mirante */
function benchSitter(): Npc {
  const zn = zoneById("mirante")!;
  const x = zn.x - 5;
  const z = zn.z - 5;
  const yaw = Math.PI / 4;
  const f = visitor("#c9b5ff");
  f.root.position.set(x + 0.08, 0.32, z + 0.08);
  f.root.rotation.y = yaw;
  return {
    id: "banco", name: "Visitante", voice: 60, x, z, reach: 3.6,
    anchor: new Vector3(x, 2.5, z),
    lines: [
      "Lá embaixo é só nuvem. Eu conferi.",
      "Esse banco é o melhor lugar da galeria.",
      "Você também veio ver o anjo?",
    ],
    object: f.root,
    tick: (t, dt, talk, p) => {
      const P = blend(rest(), SIT_EDGE, 1);
      P.lean = 0.02;
      P.sLx = 1.45 + Math.sin(t * 1.6) * 0.2;
      P.sRx = 1.45 + Math.sin(t * 1.6 + 2) * 0.2;
      P.aLx = 0.15; P.aRx = 0.15; P.fLx = -0.8; P.fRx = -0.8;
      P.headY = talk > 0 ? headTo(yaw, p.x, p.z, x, z) : Math.sin(t * 0.25) * 0.4;
      P.headX = talk > 0 ? 0 : -0.25;
      f.drive(P, 1 - Math.exp(-dt * 6));
    },
  };
}

/* ---------------- o urso da lagoa ---------------- */

function bear(): Npc {
  const zn = zoneById("lagoa")!;
  const a = -Math.PI * 0.75;
  const R = POND_R + 2.3;
  const x = zn.x + Math.cos(a) * R;
  const z = zn.z + Math.sin(a) * R;
  const fur = standard("#f6f5f1", { rough: 0.75 });
  fur.flatShading = true;
  const dark = standard("#141420", { rough: 0.4 });
  dark.flatShading = true;

  const B = new Group();
  const body = new Mesh(new IcosahedronGeometry(1, 1), fur);
  body.scale.set(0.95, 1.05, 0.85);
  body.position.y = 1.05;
  const belly = new Mesh(new IcosahedronGeometry(0.85, 1), fur);
  belly.scale.set(1, 0.7, 1);
  belly.position.set(0, 0.6, 0.18);
  B.add(body, belly);

  // patas da frente apoiadas, de trás esticadas, unhas pretas
  for (const sx of [-1, 1]) {
    B.add(tube(v(sx * 0.62, 1.45, 0.25), v(sx * 0.6, 0.62, 0.78), 0.22, fur));
    B.add(tube(v(sx * 0.5, 0.45, 0.25), v(sx * 0.58, 0.32, 1.35), 0.27, fur));
    for (let k = -1; k <= 1; k++) {
      const claw = new Mesh(new ConeGeometry(0.06, 0.2, 5), dark);
      claw.rotation.x = Math.PI / 2;
      claw.position.set(sx * 0.58 + k * 0.12, 0.3, 1.66);
      B.add(claw);
    }
  }

  const H = new Group();
  H.position.set(0, 1.95, 0.12);
  const head = new Mesh(new IcosahedronGeometry(0.56, 1), fur);
  head.position.y = 0.22;
  const snout = new Mesh(new BoxGeometry(0.34, 0.26, 0.36), fur);
  snout.position.set(0, 0.12, 0.5);
  const nose = new Mesh(new BoxGeometry(0.16, 0.1, 0.1), dark);
  nose.position.set(0, 0.2, 0.7);
  H.add(head, snout, nose);
  for (const sx of [-1, 1]) {
    const ear = new Mesh(new IcosahedronGeometry(0.17, 0), fur);
    ear.position.set(sx * 0.36, 0.66, -0.02);
    const lens = new Mesh(new BoxGeometry(0.27, 0.15, 0.06), dark);
    lens.position.set(sx * 0.17, 0.32, 0.55);
    const cup = new Mesh(new CylinderGeometry(0.18, 0.18, 0.14, 16), anodized("#ff6fc8", 0.2));
    cup.rotation.z = Math.PI / 2;
    cup.position.set(sx * 0.6, 0.24, 0);
    H.add(ear, lens, cup);
  }
  const bridge = new Mesh(new BoxGeometry(0.1, 0.04, 0.04), dark);
  bridge.position.set(0, 0.34, 0.56);
  const band = new Mesh(new TorusGeometry(0.62, 0.05, 8, 24, Math.PI), M.chrome);
  band.position.set(0, 0.24, 0);
  H.add(bridge, band);
  B.add(H);

  // a toalha e o guarda-sol: um dia de praia, só que numa ilha no céu
  const towel = new Mesh(new BoxGeometry(2.3, 0.04, 2.6), standard("#ff9ed8", { rough: 0.9 }));
  towel.position.set(0, 0.02, 0.45);
  B.add(towel);
  const umbrella = new Group();
  umbrella.add(tube(v(0, 0, 0), v(0, 3.4, 0), 0.05, M.chrome));
  const canopy = new Mesh(new ConeGeometry(1.7, 0.7, 12, 1, true), standard("#ffffff", { rough: 0.5, side: 2 }));
  canopy.position.y = 3.35;
  const stripes = new Mesh(new ConeGeometry(1.72, 0.71, 12, 1, true, 0, Math.PI / 6), standard("#ff6fc8", { rough: 0.5, side: 2 }));
  stripes.position.y = 3.35;
  umbrella.add(canopy, stripes);
  for (let i = 1; i < 6; i++) {
    const s = stripes.clone();
    s.rotation.y = (i * Math.PI) / 3;
    umbrella.add(s);
  }
  umbrella.position.set(-1.3, 0, -0.6);
  umbrella.rotation.z = 0.12;
  B.add(umbrella);

  B.scale.setScalar(1.15);
  shadowed(B, true, true);
  // a sombra do guarda-sol escurecia o urso inteiro; ele fica de fora
  umbrella.traverse((o) => (o.castShadow = false));
  B.position.set(x, 0, z);
  B.rotation.y = Math.atan2(zn.x - x, zn.z - z) + 0.35;
  OBSTACLES.push({ x, z, r: 1.55 });

  return {
    id: "urso", name: "Urso", voice: 48, x, z, reach: 4.4,
    anchor: new Vector3(x, 4.3, z),
    lines: [
      "Tá tocando uma muito boa aqui.",
      "Não, não dá pra ouvir. É só pra mim.",
      "Os peixes são de cromo. Eles não sabem.",
      "Pode sentar. A lagoa é de todo mundo.",
    ],
    object: B,
    tick: (t, _dt, talk) => {
      // ele sempre ouve alguma coisa no fone
      const b = t * Math.PI * BPS;
      H.rotation.x = Math.abs(Math.sin(b)) * 0.2 - 0.05;
      H.rotation.z = Math.sin(b * 0.5) * 0.08;
      H.rotation.y = talk > 0 ? -0.4 : Math.sin(t * 0.3) * 0.15;
      body.rotation.z = Math.sin(b * 0.5) * 0.04;
    },
  };
}

/* ---------------- quem não tem corpo aqui ---------------- */

/** a colher e o anjo moram nas esculturas; aqui só a voz deles */
function voices(): Npc[] {
  const hill = zoneById("colina")!;
  const look = zoneById("mirante")!;
  return [
    {
      id: "colher", name: "Colher", voice: 76,
      x: hill.x - 6.6, z: hill.z - 6.6, reach: 5,
      anchor: new Vector3(hill.x - 6.6, 10.2, hill.z - 6.6),
      lines: ["Oi.", "Eu só tô olhando.", "Não conta pra estrela que eu tô aqui."],
    },
    {
      id: "anjo", name: "Anjo", voice: 79,
      x: look.x, z: look.z, reach: 4.6,
      anchor: new Vector3(look.x, 7.4, look.z),
      lines: [
        "Eu sou o protetor de tela da galeria.",
        "De noite eu brilho mais. Experimenta trocar.",
        "Cuidado com a beirada. Aqui é alto.",
      ],
    },
  ];
}

/* ---------------- a bolinha que roda no átrio ---------------- */

function roller(): Npc {
  const g = new Group();
  const shellB = new Mesh(new SphereGeometry(0.4, 24, 16), M.glassBack);
  const shellF = new Mesh(new SphereGeometry(0.4, 24, 16), M.glass);
  shellB.renderOrder = 3;
  shellF.renderOrder = 4;
  const core = new Mesh(new SphereGeometry(0.2, 16, 12), anodized("#ffd04f", 0.15));
  const ring = new Mesh(new TorusGeometry(0.27, 0.04, 8, 28), anodized("#4fd8ff", 0.18));
  core.add(ring);
  g.add(core, shellB, shellF);
  shadowed(core, true, false);
  const cx = 6.6;
  const cz = 3.4;
  return {
    id: "bolinha", name: "", voice: 0, x: cx, z: cz, reach: 0,
    anchor: new Vector3(cx, 1, cz),
    lines: [],
    object: g,
    tick: (t) => {
      // um oito deitado, sem pressa
      const a = t * 0.7;
      const x = cx + Math.sin(a) * 2.2;
      const z = cz + Math.sin(a * 2) * 1.1;
      g.position.set(x, 0.4 + Math.abs(Math.sin(t * 3)) * 0.05, z);
      core.rotation.x += 0.06;
      core.rotation.z = Math.sin(a) * 0.6;
    },
  };
}

/* ---------------- o Clipe, na estante ---------------- */

/** um clipe de papel com olhos, oferecendo ajuda como os assistentes de 2001 */
function clip(): Npc {
  const zn = zoneById("estante")!;
  const x = zn.x + 2.6;
  const z = zn.z - 2.2;
  const wire = M.chrome;
  const C = new Group();
  const r = 0.07;
  const half = (cx: number, cy: number, R: number, up: boolean) => {
    const m = new Mesh(new TorusGeometry(R, r, 8, 20, Math.PI), wire);
    m.position.set(cx, cy, 0);
    if (!up) m.rotation.z = Math.PI;
    return m;
  };
  C.add(
    tube(v(-0.36, 0.25, 0), v(-0.36, 1.95, 0), r, wire),
    half(0, 1.95, 0.36, true),
    tube(v(0.36, 1.95, 0), v(0.36, 0.5, 0), r, wire),
    half(0.1, 0.5, 0.26, false),
    tube(v(-0.16, 0.5, 0), v(-0.16, 1.6, 0), r, wire),
    half(0, 1.6, 0.16, true),
    tube(v(0.16, 1.6, 0), v(0.16, 0.85, 0), r, wire),
  );
  const white = standard("#ffffff", { rough: 0.15 });
  const pupils: Mesh[] = [];
  for (const sx of [-1, 1]) {
    const ball = new Mesh(new SphereGeometry(0.16, 16, 12), white);
    ball.position.set(sx * 0.17, 1.45, 0.16);
    const pupil = new Mesh(new SphereGeometry(0.08, 12, 8), M.ink);
    pupil.position.set(sx * 0.17, 1.45, 0.29);
    const brow = tube(v(sx * 0.08, 1.68, 0.18), v(sx * 0.28, 1.72, 0.14), 0.025, M.ink);
    C.add(ball, pupil, brow);
    pupils.push(pupil);
  }
  C.scale.setScalar(1.35);
  C.position.set(x, 0, z);
  C.rotation.y = Math.PI / 4;
  shadowed(C, true, false);
  OBSTACLES.push({ x, z, r: 0.6 });
  return {
    id: "clipe", name: "Clipe", voice: 74, x, z, reach: 3.6,
    anchor: new Vector3(x, 3.4, z),
    lines: [
      "Parece que você está procurando um artigo. Quer ajuda?",
      "Os quatro estão aqui na estante. Eu já li todos. Duas vezes.",
      "Dica: comece pelo primeiro. É a história de como ele trocou o código pelo design.",
    ],
    action: { id: "read", label: "Ver os artigos" },
    object: C,
    tick: (t, _dt, talk, p) => {
      C.position.y = Math.abs(Math.sin(t * (talk > 0 ? 6 : 2))) * (talk > 0 ? 0.18 : 0.06);
      C.rotation.z = Math.sin(t * 1.4) * 0.06;
      // os olhos acompanham o visitante
      const ang = Math.atan2(p.x - x, p.z - z) - C.rotation.y;
      const dx = Math.max(-0.06, Math.min(0.06, Math.sin(ang) * 0.06));
      pupils.forEach((pu, i) => (pu.position.x = (i ? 0.17 : -0.17) + dx));
    },
  };
}

/* ---------------- a visitante que medita, no jardim ---------------- */

function monk(): Npc {
  const zn = zoneById("jardim")!;
  const [dx, dz] = PLACE.garden.monk;
  const x = zn.x + dx;
  const z = zn.z + dz;
  const yaw = Math.atan2(zn.x - x, zn.z - z) + 0.5;
  const f = visitor("#ffe3a0");
  f.root.position.set(x, 0, z);
  f.root.rotation.y = yaw;
  OBSTACLES.push({ x, z, r: 0.7 });
  return {
    id: "meditando", name: "Visitante", voice: 57, x, z, reach: 3.8,
    anchor: new Vector3(x, 2.6, z),
    lines: [
      "Inspira. Expira.",
      "A galeria não vai sair daqui. Pode ir devagar.",
      "Quer respirar junto? São só quatro respirações.",
    ],
    action: { id: "breathe", label: "Respirar junto" },
    object: f.root,
    tick: (t, dt, talk, p) => {
      const P = blend(rest(), LOTUS, 1);
      const breath = Math.sin(t * (Math.PI / 4));
      P.lift = -0.6 + 0.12 + breath * 0.05;
      P.lean = -0.02 + breath * 0.02;
      P.headY = talk > 0 ? headTo(yaw, p.x, p.z, x, z) * 0.7 : 0;
      f.root.position.y = 0.35 + Math.sin(t * 0.8) * 0.08;
      f.drive(P, 1 - Math.exp(-dt * 5));
    },
  };
}

/* ---------------- o garoto do fliperama ---------------- */

function gamer(): Npc {
  const zn = zoneById("fliperama")!;
  const [cx, cz] = PLACE.arcade.cabs[1];
  // de frente para o segundo gabinete, um passo atrás dele
  const x = zn.x + cx + 0.95;
  const z = zn.z + cz + 0.95;
  const yaw = Math.PI / 4 + Math.PI;
  const f = visitor("#8fd8ff");
  f.root.position.set(x, 0, z);
  f.root.rotation.y = yaw;
  OBSTACLES.push({ x, z, r: 0.5 });
  return {
    id: "jogador", name: "Jogador", voice: 71, x, z, reach: 3.4,
    anchor: new Vector3(x, 2.4, z),
    lines: [
      "Meu recorde é 340. Duvido você passar.",
      "Pega as estrelas que caem. As douradas valem mais.",
      "O fliperama é de graça. As fichas são decorativas.",
    ],
    action: { id: "play", label: "Jogar" },
    object: f.root,
    tick: (t, dt, talk, p) => {
      const P = rest();
      const mash = Math.sin(t * 16);
      blend(P, { aLx: -1.1, aRx: -1.1, aLz: 0.25, aRz: -0.25, fLx: -0.6 + mash * 0.12, fRx: -0.6 - mash * 0.12, lean: 0.12, headX: 0.15 }, talk > 0 ? 0.3 : 1);
      // de vez em quando ele comemora
      const cheer = Math.max(0, Math.sin(t * 0.9)) > 0.97;
      if (cheer && talk <= 0) blend(P, { aLx: -2.9, aRx: -2.9, fLx: 0, fRx: 0, lift: 0.08, headX: -0.3 }, 1);
      P.headY = talk > 0 ? headTo(yaw, p.x, p.z, x, z) : 0;
      P.lift += Math.abs(Math.sin(t * 5)) * 0.02;
      f.drive(P, 1 - Math.exp(-dt * 10));
    },
  };
}

/* ---------------- o robô-guia do átrio ---------------- */

function robot(): Npc {
  const x = -2.2;
  const z = 6.2;
  const R = new Group();
  const shell = standard("#ffffff", { metal: 1, rough: 0.12, env: 1.4 });
  const head = new Mesh(new SphereGeometry(0.55, 32, 22), shell);
  // o visor: uma telinha com olhos em pixel
  const c = document.createElement("canvas");
  c.width = 32;
  c.height = 16;
  const g = c.getContext("2d")!;
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  tex.magFilter = NearestFilter;
  tex.minFilter = NearestFilter;
  const visor = new Mesh(new PlaneGeometry(0.72, 0.36), new MeshBasicMaterial({ map: tex }));
  visor.position.set(0, 0.02, 0.5);
  const ring = new Mesh(new TorusGeometry(0.62, 0.05, 8, 40), anodized("#4fd8ff", 0.15));
  ring.rotation.x = Math.PI / 2;
  const antenna = tube(v(0, 0.5, 0), v(0.1, 0.95, 0), 0.025, M.chrome);
  const bulb = new Mesh(new SphereGeometry(0.08, 12, 8), new MeshBasicMaterial({ color: "#ff6fc8" }));
  bulb.position.set(0.1, 0.98, 0);
  const jet = new Mesh(new ConeGeometry(0.22, 0.4, 16, 1, true), new MeshBasicMaterial({ color: "#9ff3ff", transparent: true, opacity: 0.5, depthWrite: false }));
  jet.position.y = -0.62;
  jet.rotation.x = Math.PI;
  R.add(head, visor, ring, antenna, bulb, jet);
  R.position.set(x, 1.6, z);
  shadowed(head, true, false);
  OBSTACLES.push({ x, z, r: 0.75 });

  let blink = 0;
  const paint = (t: number, talk: boolean) => {
    g.fillStyle = "#08121f";
    g.fillRect(0, 0, 32, 16);
    g.fillStyle = "#7ff0ff";
    const shut = (t % 3.2) < 0.12;
    for (const ex of [9, 21]) {
      if (talk) {
        // olhos felizes
        g.fillRect(ex - 2, 7, 1, 1); g.fillRect(ex - 1, 6, 1, 1); g.fillRect(ex, 5, 1, 1); g.fillRect(ex + 1, 6, 1, 1); g.fillRect(ex + 2, 7, 1, 1);
      } else if (shut) g.fillRect(ex - 2, 8, 4, 1);
      else g.fillRect(ex - 2, 5, 3, 5);
    }
    tex.needsUpdate = true;
  };

  return {
    id: "guia", name: "Robô-guia", voice: 81, x, z, reach: 4,
    anchor: new Vector3(x, 3.4, z),
    lines: [
      "Bem-vindo! Quer que eu mostre o caminho? O tour passa pelas seis salas.",
      "Dica: segure Shift para virar bolinha. É mais rápido e é mais divertido.",
      "Viu os tubos de vidro no céu? São atalhos. Vire bolinha e encoste na boca de um deles.",
      "Tem oito estrelas escondidas pela galeria. Eu não posso dizer onde. Posso dizer que uma fica bem alto.",
    ],
    action: { id: "tour", label: "Fazer o tour" },
    object: R,
    tick: (t, dt, talk, p) => {
      R.position.y = 1.6 + Math.sin(t * 2) * 0.12;
      const want = Math.atan2(p.x - x, p.z - z);
      R.rotation.y += (Math.atan2(Math.sin(want - R.rotation.y), Math.cos(want - R.rotation.y))) * Math.min(1, dt * (talk > 0 ? 6 : 1.5));
      R.rotation.z = Math.sin(t * 1.3) * 0.08;
      ring.rotation.z = t * 2;
      jet.scale.y = 0.8 + Math.sin(t * 30) * 0.2;
      (bulb.material as MeshBasicMaterial).color.set(Math.sin(t * 4) > 0 ? "#ff6fc8" : "#ffffff");
      blink += dt;
      if (blink > 0.08) { blink = 0; paint(t, talk > 0); }
    },
  };
}

export function buildNpcs(): Npc[] {
  return [sitter(), photographer(), benchSitter(), bear(), roller(), clip(), monk(), gamer(), robot(), ...voices()];
}
