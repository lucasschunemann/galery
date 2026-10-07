import {
  AdditiveBlending,
  CanvasTexture,
  CatmullRomCurve3,
  CircleGeometry,
  Color,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  Quaternion,
  ShaderMaterial,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from "three";
import { M, U, glass } from "./materials";
import { OBSTACLES, groundY, zoneById, type Zone } from "./layout";
import { BELOW } from "./build";
import { onLayer } from "./geo";

/* ============================================================
   Os tubos, como no Snaptic: canos de vidro que atravessam o
   céu e ligam as ilhas mais distantes.

   Cada ponta é uma estação: uma boca no chão, com um redemoinho
   de luz, e um funil de vidro em cima. Chegando perto como
   bolinha, ela é sugada e corre pelo tubo até a outra ponta,
   onde salta para fora. Como boneco, basta apertar E perto da
   boca ou clicar no tubo: ele vira bolinha e entra sozinho.

   Os tubos sobem retos da boca, fazem um arco bem acima de
   tudo (paredes, letreiros, a estrela da colina) e descem retos
   na outra ponta. Dentro de cada um corre uma luz-guia
   tracejada, na cor da linha.
   ============================================================ */

export interface Station {
  id: string;
  zone: Zone;
  x: number;
  z: number;
  y: number;
  tube: Tube;
  /** 0 começo da curva, 1 fim */
  end: 0 | 1;
  /** para onde esta boca leva */
  to: Zone;
  anchor: Vector3;
  swirl: Mesh;
}

export interface Tube {
  curve: CatmullRomCurve3;
  length: number;
  color: string;
  ends: [Station, Station];
  hit: Mesh;
}

/** as linhas: [zona, posição da boca], [zona, posição da boca], cor */
const LINES: [string, [number, number], string, [number, number], string][] = [
  ["atrio", [-6.5, 3.2], "colina", [8, 6], "#ff6fc8"],
  ["atrio", [6.8, -6], "fliperama", [-5, 4.5], "#ffc23a"],
  ["atrio", [1.8, 8], "jardim", [2.5, -6.5], "#69c98f"],
  ["fliperama", [2.2, 6.6], "lagoa", [8.5, 3], "#4fd8ff"],
  ["jardim", [6.5, 5.5], "mirante", [-4, 6.5], "#b996ff"],
  ["estante", [5, 4.5], "colina", [-8.5, 5], "#5f8cff"],
];

const RADIUS = 0.55;
const MOUTH = 0.92;

/* a luz-guia: traços que correm pelo tubo, mais fortes à noite */
const GUIDE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const GUIDE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uCount;
  uniform float uNight;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float d = fract(vUv.x * uCount - uTime * 0.9);
    float a = smoothstep(0.0, 0.08, d) * (1.0 - smoothstep(0.3, 0.45, d));
    gl_FragColor = vec4(uColor * 1.5, a * (0.35 + 0.5 * uNight));
  }
`;

/** o redemoinho da boca: uma espiral pintada uma vez e girada para sempre */
function paintSwirl() {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const m = S / 2;
  const grd = g.createRadialGradient(m, m, 0, m, m, m);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.5, "rgba(255,255,255,0.35)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.lineWidth = 5;
  for (let arm = 0; arm < 3; arm++) {
    g.beginPath();
    for (let k = 0; k <= 40; k++) {
      const u = k / 40;
      const a = arm * ((Math.PI * 2) / 3) + u * Math.PI * 1.6;
      const r = 6 + u * (m - 10);
      const x = m + Math.cos(a) * r;
      const y = m + Math.sin(a) * r;
      if (k === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  return new CanvasTexture(c);
}

function curveBetween(a: Vector3, b: Vector3, bend: number) {
  const flat = new Vector3(b.x - a.x, 0, b.z - a.z);
  const d = flat.length();
  const dir = flat.clone().normalize();
  const side = new Vector3(-dir.z, 0, dir.x);
  const H = 9.5 + d * 0.07;
  const mid = a.clone().lerp(b, 0.5).setY(Math.max(a.y, b.y) + H).addScaledVector(side, d * 0.1 * bend);
  const up = (p: Vector3, y: number) => p.clone().setY(p.y + y);
  return new CatmullRomCurve3([
    up(a, 0.9),
    up(a, 3.4),
    up(a, 6.8).addScaledVector(dir, 2.4),
    mid,
    up(b, 6.8).addScaledVector(dir, -2.4),
    up(b, 3.4),
    up(b, 0.9),
  ], false, "centripetal");
}

export function buildTubes() {
  const group = new Group();
  const stations: Station[] = [];
  const tubes: Tube[] = [];
  const guides: ShaderMaterial[] = [];
  const swirlTex = paintSwirl();

  // o funil: um sino de vidro que alarga para baixo
  const bell = new LatheGeometry(
    [[MOUTH + 0.18, 0], [MOUTH, 0.25], [0.78, 0.6], [RADIUS + 0.06, 1.15], [RADIUS + 0.06, 1.6]].map(([x, y]) => new Vector2(x, y)),
    32,
  );

  LINES.forEach(([za, pa, zb, pb, color], li) => {
    const A = zoneById(za)!;
    const B = zoneById(zb)!;
    const pA = new Vector3(A.x + pa[0], 0, A.z + pa[1]);
    const pB = new Vector3(B.x + pb[0], 0, B.z + pb[1]);
    pA.y = groundY(pA.x, pA.z);
    pB.y = groundY(pB.x, pB.z);
    const curve = curveBetween(pA, pB, li % 2 ? 1 : -1);
    const length = curve.getLength();
    const segs = Math.ceil(length * 1.6);

    // o vidro: de trás e da frente, para a borda brilhar dos dois lados
    const geo = new TubeGeometry(curve, segs, RADIUS, 14, false);
    const back = new Mesh(geo, glass(color, 0.5, 1));
    const front = new Mesh(geo, glass(color, 0.95));
    back.renderOrder = 3;
    front.renderOrder = 4;
    group.add(back, front);

    // a luz-guia por dentro
    const guide = new ShaderMaterial({
      uniforms: { uTime: U.uTime, uNight: U.uNight, uCount: { value: length / 2.6 }, uColor: { value: new Color(color) } },
      vertexShader: GUIDE_VERT,
      fragmentShader: GUIDE_FRAG,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    guides.push(guide);
    const line = new Mesh(new TubeGeometry(curve, segs, 0.07, 6, false), guide);
    line.renderOrder = 5;
    group.add(line);

    // aros de cromo a cada tantos metros, como as emendas de um cano
    const ring = new TorusGeometry(RADIUS + 0.05, 0.07, 8, 28);
    const z = new Vector3(0, 0, 1);
    const n = Math.floor(length / 6.5);
    for (let i = 1; i < n; i++) {
      const u = i / n;
      const m = new Mesh(ring, M.chrome);
      m.position.copy(curve.getPointAt(u));
      m.quaternion.copy(new Quaternion().setFromUnitVectors(z, curve.getTangentAt(u)));
      group.add(m);
    }

    const tube: Tube = { curve, length, color, ends: [] as unknown as [Station, Station], hit: front };

    // as duas estações
    ([[A, pA, B, 0], [B, pB, A, 1]] as const).forEach(([zone, p, to, end]) => {
      const st = new Group();
      st.position.copy(p);
      const rim = new Mesh(new TorusGeometry(MOUTH, 0.1, 10, 40), M.chrome);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.06;
      const swirl = new Mesh(new CircleGeometry(MOUTH - 0.05, 32), new MeshBasicMaterial({ map: swirlTex, color, transparent: true, opacity: 0.85, blending: AdditiveBlending, depthWrite: false }));
      swirl.rotation.x = -Math.PI / 2;
      swirl.position.y = 0.04;
      const funnelB = new Mesh(bell, glass(color, 0.5, 1));
      const funnelF = new Mesh(bell, glass(color, 0.95));
      funnelB.position.y = funnelF.position.y = 1.0;
      funnelB.renderOrder = 3;
      funnelF.renderOrder = 4;
      const lip = new Mesh(new TorusGeometry(MOUTH + 0.18, 0.06, 8, 36), M.chrome);
      lip.rotation.x = Math.PI / 2;
      lip.position.y = 1.0;
      st.add(rim, onLayer(swirl, BELOW), funnelB, funnelF, lip);
      group.add(st);

      // a boca não deixa o boneco passar; a bolinha é sugada antes de encostar
      OBSTACLES.push({ x: p.x, z: p.z, r: MOUTH - 0.05 });

      const station: Station = {
        id: `${zone.id}>${to.id}`,
        zone, to, end, tube, swirl,
        x: p.x, z: p.z, y: p.y,
        anchor: new Vector3(p.x, p.y + 3.1, p.z),
      };
      stations.push(station);
      tube.ends[end] = station;
    });
    tubes.push(tube);
  });

  return {
    group,
    stations,
    tubes,
    hits: tubes.map((t) => t.hit),
    tick(t: number) {
      stations.forEach((s, i) => (s.swirl.rotation.z = -t * 2.2 - i));
    },
  };
}
