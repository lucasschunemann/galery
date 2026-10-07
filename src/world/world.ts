import {
  Color,
  DirectionalLight,
  HalfFloatType,
  HemisphereLight,
  LinearFilter,
  Mesh,
  NearestFilter,
  NeutralToneMapping,
  OrthographicCamera,
  PCFShadowMap,
  PlaneGeometry,
  PMREMGenerator,
  RingGeometry,
  MeshBasicMaterial,
  Raycaster,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
  type Texture,
} from "three";
import { PALETTES, paintEnvironment, type ThemeName } from "./env";
import { U, applyTone, setEnvironment } from "./materials";
import { buildArchitecture, BELOW, type Built } from "./build";
import { buildSculpture, type Sculpture } from "./sculptures";
import { bubbles, clouds, cubes, sparkles } from "./ambient";
import { Player } from "./player";
import { buildNpcs, type Npc } from "./npcs";
import { hiddenStars, jumpPads, popBubbles } from "./play";
import { buildTubes, type Station, type Tube } from "./tubes";
import { anodized } from "./materials";
import { ZONES, groundY, standPoint, walkable, zoneById, type Zone } from "./layout";

/* ============================================================
   O motor.

   A cena é renderizada pequena (um terço da tela, mais ou
   menos) e ampliada sem suavização, que é o que dá o aspecto
   de render de 2001. Para o pixel não "nadar" quando a câmera
   anda, a câmera se move em degraus de um texel e o canvas
   inteiro é deslocado pelo resto, em CSS.

   O piso é um espelho: uma segunda câmera, refletida no plano
   y = 0, renderiza a cena de baixo para cima numa textura que
   o material do piso lê em coordenadas de projeção.
   ============================================================ */

const ISO = new Vector3(1, 0.92, 1).normalize();
const RIGHT = new Vector3(1, 0, -1).normalize();
const CAM_UP = new Vector3().crossVectors(RIGHT, ISO.clone().negate()).normalize();
const DIST = 140;
const SUN_DIR = new Vector3(-7, 16, 9).normalize();

const POST_FRAG = /* glsl */ `
  uniform sampler2D tScene;
  uniform float uLevels;
  uniform float uVignette;
  varying vec2 vUv;
  float bayer4(vec2 p) {
    vec2 q = mod(floor(p), 4.0);
    float i = q.x + q.y * 4.0;
    // matriz de Bayer 4x4, desenrolada
    if (i < 1.0) return 0.0; if (i < 2.0) return 8.0; if (i < 3.0) return 2.0; if (i < 4.0) return 10.0;
    if (i < 5.0) return 12.0; if (i < 6.0) return 4.0; if (i < 7.0) return 14.0; if (i < 8.0) return 6.0;
    if (i < 9.0) return 3.0; if (i < 10.0) return 11.0; if (i < 11.0) return 1.0; if (i < 12.0) return 9.0;
    if (i < 13.0) return 15.0; if (i < 14.0) return 7.0; if (i < 15.0) return 13.0; return 5.0;
  }
  void main() {
    gl_FragColor = texture2D(tScene, vUv);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    vec3 c = gl_FragColor.rgb;
    vec2 q = vUv - 0.5;
    c *= 1.0 - uVignette * dot(q, q) * 1.4;
    float d = (bayer4(gl_FragCoord.xy) + 0.5) / 16.0 - 0.5;
    c = floor(c * uLevels + 0.5 + d) / uLevels;
    gl_FragColor = vec4(c, 1.0);
  }
`;

const BG_FRAG = /* glsl */ `
  uniform vec2 uRes;
  uniform vec3 uSkyTop;
  uniform vec3 uSkyBot;
  uniform float uNight;
  uniform float uTime;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec3 c = mix(uSkyBot, uSkyTop, smoothstep(0.0, 1.0, uv.y));
    // estrelas, só à noite
    float h = hash(floor(gl_FragCoord.xy));
    float tw = 0.45 + 0.55 * sin(uTime * 1.7 + h * 60.0);
    c += uNight * step(0.9975, h) * tw * smoothstep(0.2, 0.95, uv.y) * vec3(1.0, 0.88, 1.0) * 1.3;
    gl_FragColor = vec4(c, 1.0);
  }
`;

export type Mode = "attract" | "follow";

export interface WorldEvents {
  near: (z: Zone | null) => void;
  interact: (z: Zone) => void;
  moveStart: () => void;
  step: (surface: "tile" | "grass") => void;
  morph: (toMarble: boolean) => void;
  jump: (double: boolean) => void;
  land: (impact: number) => void;
  sit: () => void;
  launch: () => void;
  tube: (kind: "in" | "out", st: Station) => void;
  station: (st: Station | null) => void;
  npcAction: (npc: Npc) => void;
  pop: () => void;
  star: (count: number, total: number) => void;
  chat: (npc: Npc | null) => void;
  frame: () => void;
}

export class World {
  canvas: HTMLCanvasElement;
  renderer: WebGLRenderer;
  scene = new Scene();
  camera = new OrthographicCamera(-1, 1, 1, -1, 1, 400);
  player = new Player();
  mode: Mode = "attract";
  theme: ThemeName = "day";
  pixel = 3;
  zoomGoal = 8.2;
  near: Zone | null = null;
  inputLocked = false;
  /** deslocamento do enquadramento, em px de tela (o painel aberto empurra a cena) */
  frameOffset = new Vector2();
  focusZone: Zone | null = null;
  /** no toque não há Shift: um botão trava o modo bolinha */
  marbleLatch = false;

  private on: Partial<WorldEvents> = {};
  private rt: WebGLRenderTarget;
  private reflRT: WebGLRenderTarget;
  private reflCam = new OrthographicCamera(-1, 1, 1, -1, 1, 400);
  private reflEnabled = true;
  private postScene = new Scene();
  private postCam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private post: ShaderMaterial;
  private hemi: HemisphereLight;
  private sun: DirectionalLight;
  private envs: Record<ThemeName, { pmrem: Texture; equi: Texture }>;
  private built: Built;
  private sculptures: { zone: Zone; s: Sculpture; near: number }[] = [];
  private hits: { zone: Zone; mesh: Mesh }[] = [];
  npcs: Npc[] = [];
  pads!: ReturnType<typeof jumpPads>;
  pops!: ReturnType<typeof popBubbles>;
  stars!: ReturnType<typeof hiddenStars>;
  private gold = false;
  tubes!: ReturnType<typeof buildTubes>;
  private ride: { tube: Tube; from: 0 | 1; t: number; dur: number; last: Vector3; exit: Station } | null = null;
  private pendingTube: Station | null = null;
  private tubeCooldown = 0;
  private zoomBefore = 0;
  stationNear: Station | null = null;
  private tubeHits: { st: Station; mesh: Mesh }[] = [];
  talking: Npc | null = null;
  private talkW = new Map<string, number>();
  private amb: { clouds: ReturnType<typeof clouds>; cubes: ReturnType<typeof cubes>; bubbles: ReturnType<typeof bubbles>; sparks: ReturnType<typeof sparkles> };
  private target = new Vector3();
  private zoom = 24;
  private iw = 1;
  private ih = 1;
  private themeT = 0;
  private themeGoal = 0;
  private envFor: ThemeName = "day";
  private keys = new Set<string>();
  private nearPull = 0;
  private pullTo = new Vector3();
  private driving = false;
  private reflectAmt = 0.2;
  private jumpQueued = false;
  private t = 0;
  private last = performance.now();
  private raf = 0;
  private frameTimes: number[] = [];
  private quality = 2;
  private pointer: { id: number; x: number; y: number; down: number; moved: boolean } | null = null;
  private pinch: Map<number, { x: number; y: number }> = new Map();
  private pinchDist = 0;
  private holdTimer = 0;
  private ray = new Raycaster();
  private ripples: { mesh: Mesh; mat: MeshBasicMaterial; life: number }[] = [];
  private rippleAt = 0;
  private marker!: Mesh;
  private markerMat!: MeshBasicMaterial;
  private reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  constructor(host: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: false, alpha: false, powerPreference: "high-performance" });
    this.canvas = this.renderer.domElement;
    this.canvas.className = "stage";
    this.canvas.setAttribute("aria-hidden", "true");
    host.appendChild(this.canvas);

    const r = this.renderer;
    r.setPixelRatio(1);
    r.toneMapping = NeutralToneMapping;
    r.toneMappingExposure = 1;
    r.shadowMap.enabled = true;
    r.shadowMap.type = PCFShadowMap;
    r.shadowMap.autoUpdate = false;
    r.setClearColor(0x000000, 0);

    this.rt = new WebGLRenderTarget(1, 1, { type: HalfFloatType, minFilter: NearestFilter, magFilter: NearestFilter });
    this.reflRT = new WebGLRenderTarget(1, 1, { type: HalfFloatType, minFilter: LinearFilter, magFilter: LinearFilter });
    U.uReflectMap.value = this.reflRT.texture;

    this.post = new ShaderMaterial({
      uniforms: { tScene: { value: this.rt.texture }, uLevels: { value: 40 }, uVignette: { value: 0.35 } },
      vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: POST_FRAG,
      depthTest: false,
      depthWrite: false,
    });
    const quad = new Mesh(new PlaneGeometry(2, 2), this.post);
    quad.frustumCulled = false;
    this.postScene.add(quad);

    // o céu é desenhado atrás de tudo, na tela
    const bg = new Mesh(
      new PlaneGeometry(2, 2),
      new ShaderMaterial({
        uniforms: { uRes: U.uRes, uSkyTop: U.uSkyTop, uSkyBot: U.uSkyBot, uNight: U.uNight, uTime: U.uTime },
        vertexShader: "void main(){ gl_Position = vec4(position.xy, 0.9999, 1.0); }",
        fragmentShader: BG_FRAG,
        depthTest: false,
        depthWrite: false,
      }),
    );
    bg.frustumCulled = false;
    bg.renderOrder = -1000;
    // o espelho não reflete o céu, só os objetos: o piso fica limpo
    bg.layers.set(BELOW);
    this.scene.add(bg);

    // luz
    this.hemi = new HemisphereLight("#e6f4ff", "#d9d2c4", 1.15);
    this.sun = new DirectionalLight("#fff4e2", 2.5);
    this.sun.castShadow = true;
    const sc = this.sun.shadow.camera;
    sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 120;
    this.sun.shadow.bias = -0.0006;
    this.sun.shadow.normalBias = 0.03;
    const small = Math.min(innerWidth, innerHeight) < 700;
    this.sun.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
    this.scene.add(this.hemi, this.sun, this.sun.target);

    // ambiente, pintado na hora
    const pm = new PMREMGenerator(r);
    const make = (n: ThemeName) => {
      const equi = paintEnvironment(n);
      return { equi, pmrem: pm.fromEquirectangular(equi).texture };
    };
    this.envs = { day: make("day"), night: make("night") };
    pm.dispose();

    // mundo
    this.built = buildArchitecture();
    this.scene.add(this.built.root);
    for (const zone of ZONES) {
      const s = buildSculpture(zone);
      this.scene.add(s.group);
      this.sculptures.push({ zone, s, near: 0 });
      const hit = new Mesh(new SphereGeometry(zone.kind === "atrium" ? 4.6 : zone.kind === "pond" ? 4 : zone.kind === "garden" ? 2.8 : 2.4, 8, 6));
      hit.visible = false;
      hit.position.set(zone.focus.x, zone.kind === "hill" ? 6 : zone.kind === "lookout" ? 4 : zone.kind === "pond" ? 1.6 : zone.kind === "atrium" ? 2.8 : zone.kind === "garden" ? 2.4 : 2.2, zone.focus.z);
      this.scene.add(hit);
      this.hits.push({ zone, mesh: hit });
    }
    this.amb = { clouds: clouds(), cubes: cubes(), bubbles: bubbles(), sparks: sparkles() };
    this.scene.add(this.amb.clouds.object, this.amb.cubes.object, this.amb.bubbles.object, this.amb.sparks.object);

    this.npcs = buildNpcs();
    for (const n of this.npcs) if (n.object) this.scene.add(n.object);
    this.pads = jumpPads();
    this.pops = popBubbles();
    this.stars = hiddenStars();
    this.scene.add(this.pads.object, this.pops.object, this.stars.object);
    this.tubes = buildTubes();
    this.scene.add(this.tubes.group);
    for (const st of this.tubes.stations) {
      const m = new Mesh(new SphereGeometry(1.3, 8, 6));
      m.visible = false;
      m.position.set(st.x, st.y + 1.6, st.z);
      this.scene.add(m);
      this.tubeHits.push({ st, mesh: m });
    }
    if (this.stars.count >= this.stars.total) this.golden(false);

    this.scene.add(this.player.root, this.player.contact);
    this.player.contact.layers.set(BELOW);
    this.player.place(1.5, 3.5);
    this.player.onStep = () => {
      this.on.step?.(groundY(this.player.pos.x, this.player.pos.z) > 0.02 ? "grass" : "tile");
      // correndo, levanta um pouco de brilho do chão
      if (this.player.speed > 4.5 && Math.random() < 0.5) {
        this.amb.sparks.emit(this.player.root.position.clone().setY(this.player.pos.y + 0.08), "#ffffff", 1, 0.3, 0.25);
      }
    };
    this.player.onJump = (double) => {
      this.on.jump?.(double);
      if (double) this.amb.sparks.emit(this.player.root.position.clone().setY(this.player.root.position.y + 0.4), "#ffffff", 8, 0.6, 1.8);
    };
    this.player.onSit = () => this.on.sit?.();
    this.player.onLand = (k) => {
      this.on.land?.(k);
      if (k > 0.5) this.amb.sparks.emit(this.player.root.position.clone().setY(this.player.pos.y + 0.1), "#ffffff", 5, 0.7, 1.4);
    };
    this.player.onMorph = (m) => {
      this.amb.sparks.emit(this.player.root.position.clone().setY(this.player.pos.y + 0.6), m ? "#ff9edf" : "#9ff3ff", 14, 0.6, 2.4);
      this.on.morph?.(m);
    };

    // ondas no chão onde se clica, e um alvo enquanto o boneco anda até lá
    const rg = new RingGeometry(0.42, 0.54, 48);
    rg.rotateX(-Math.PI / 2);
    for (let i = 0; i < 6; i++) {
      const mat = new MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0, depthWrite: false });
      const mesh = new Mesh(rg, mat);
      mesh.layers.set(BELOW);
      mesh.renderOrder = 3;
      mesh.visible = false;
      this.scene.add(mesh);
      this.ripples.push({ mesh, mat, life: 1 });
    }
    const mg = new RingGeometry(0.26, 0.36, 4, 1);
    mg.rotateX(-Math.PI / 2);
    this.markerMat = new MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.9, depthWrite: false });
    this.marker = new Mesh(mg, this.markerMat);
    this.marker.layers.set(BELOW);
    this.marker.renderOrder = 3;
    this.marker.visible = false;
    this.scene.add(this.marker);

    this.camera.layers.enable(BELOW);
    this.reflCam.layers.set(0);

    const hour = new Date().getHours();
    this.setTheme(hour >= 19 || hour < 6 ? "night" : "day", false);

    this.target.set(0, 0, -20);
    this.resize();
    addEventListener("resize", () => this.resize());
    this.bindInput();

    // compila tudo antes do primeiro quadro, para não engasgar na entrada
    r.compile(this.scene, this.camera);
  }

  listen(ev: Partial<WorldEvents>) { Object.assign(this.on, ev); }

  start() {
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      this.frame();
    };
    loop();
  }

  stopLoop() { cancelAnimationFrame(this.raf); }

  /* ---------------- API para a interface ---------------- */

  enter() {
    this.mode = "follow";
    this.zoomGoal = innerWidth < 700 ? 7.5 : 8.2;
    setTimeout(() => this.player.hello(), this.reduced ? 0 : 900);
  }

  travelTo(id: string, arrive?: (z: Zone) => void) {
    const zn = zoneById(id);
    if (!zn) return;
    const p = standPoint(zn);
    const far = Math.hypot(p.x - this.player.pos.x, p.z - this.player.pos.z) > 16;
    this.player.goTo(p.x, p.z, () => {
      this.faceFocus(zn);
      arrive?.(zn);
    });
    this.player.autoMarble = far;
  }

  setTheme(name: ThemeName, animate = true) {
    this.theme = name;
    this.themeGoal = name === "night" ? 1 : 0;
    if (!animate || this.reduced) this.themeT = this.themeGoal;
    this.applyTheme();
    document.documentElement.dataset.theme = name;
  }

  setPixel(n: number) {
    this.pixel = n;
    this.resize();
  }

  /** pontos do mundo para a tela, para as etiquetas HTML */
  toScreen(p: Vector3, out: { x: number; y: number; on: boolean }) {
    const v = p.clone().project(this.camera);
    const rect = this.canvas.getBoundingClientRect();
    out.x = rect.left + ((v.x + 1) / 2) * rect.width;
    out.y = rect.top + ((1 - v.y) / 2) * rect.height;
    out.on = v.x > -1.1 && v.x < 1.1 && v.y > -1.1 && v.y < 1.1;
    return out;
  }

  get anchors() { return this.built.anchors; }

  /** uma chuva de brilhos na escultura, quando a placa abre */
  /** a pele dourada, de quem achou as oito estrelas */
  golden(party = true) {
    if (this.gold) return;
    this.gold = true;
    this.player.skin(anodized("#ffcf6a", 0.12));
    if (party) {
      const p = this.player.root.position.clone().setY(this.player.pos.y + 1);
      this.amb.sparks.emit(p, "#ffd23a", 30, 1.2, 4);
      this.amb.sparks.emit(p, "#ffffff", 20, 1, 3);
    }
  }

  emote(name: "wave" | "dance" | "sit" | "stretch") {
    if (this.mode === "follow" && !this.inputLocked) this.player.emote(name);
  }

  meditate(on: boolean) {
    this.player.meditating = on;
    if (on) this.player.stop();
  }

  celebrate(zn: Zone) {
    const c = new Vector3(zn.focus.x, zn.kind === "hill" ? 6 : zn.kind === "lookout" ? 4.4 : zn.kind === "garden" ? 3 : 2.6, zn.focus.z);
    this.amb.sparks.emit(c, zn.color, 14, 2.6, 2.2);
    this.amb.sparks.emit(c, "#ffffff", 10, 2.6, 2.2);
  }

  private ripple(x: number, z: number, color = "#ffffff") {
    const r = this.ripples[this.rippleAt];
    this.rippleAt = (this.rippleAt + 1) % this.ripples.length;
    r.mesh.position.set(x, groundY(x, z) + 0.03, z);
    r.mat.color.set(color);
    r.life = 0;
    r.mesh.visible = true;
  }

  private tickRipples(dt: number) {
    for (const r of this.ripples) {
      if (r.life >= 1) { r.mesh.visible = false; continue; }
      r.life = Math.min(1, r.life + dt / 0.75);
      const e = 1 - Math.pow(1 - r.life, 3);
      r.mesh.scale.setScalar(0.6 + e * 3.4);
      r.mat.opacity = Math.pow(1 - r.life, 1.4) * 0.95;
    }
    const end = this.player.path[this.player.path.length - 1];
    this.marker.visible = !!end && this.mode === "follow";
    if (end) {
      this.marker.position.set(end.x, groundY(end.x, end.z) + 0.035, end.z);
      this.marker.rotation.y = this.t * 1.6;
      this.marker.scale.setScalar(1 + Math.sin(this.t * 6) * 0.12);
      this.markerMat.opacity = 0.75 + Math.sin(this.t * 6) * 0.2;
    }
  }

  /* ---------------- quadro ---------------- */

  private frame() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.t += dt;
    U.uTime.value = this.t;

    this.adapt(dt);
    this.tickTheme(dt);

    // o boneco
    const drive = this.drive();
    const driving = !!(drive.x || drive.z);
    if (driving && !this.driving) this.on.moveStart?.();
    if (driving) this.pendingTube = null;
    this.driving = driving;
    const riding = !!this.ride;
    if (riding) this.tickRide(dt);
    else this.player.update(dt, this.t, this.mode === "follow" ? drive : { x: 0, z: 0, marble: false, jump: false });
    this.tubeCooldown = Math.max(0, this.tubeCooldown - dt);
    this.tubes.tick(this.t);
    this.checkTubes();
    if (this.player.morph > 0.5 && this.player.speed > 2) {
      if (Math.random() < dt * 22) {
        this.amb.sparks.emit(this.player.root.position.clone().setY(this.player.pos.y + 0.3), Math.random() > 0.5 ? "#ff9edf" : "#9ff3ff", 1, 0.4, 0.4);
      }
    }

    // proximidade
    let best: Zone | null = null;
    let bd = Infinity;
    for (const it of this.sculptures) {
      const z = it.zone;
      const reach = z.kind === "atrium" ? 7.6 : z.kind === "hill" ? 6.5 : z.kind === "pond" ? 8.8 : z.kind === "lookout" || z.kind === "garden" ? 5.6 : z.kind === "arcade" || z.kind === "library" ? 5.2 : 4.9;
      const d = Math.hypot(this.player.pos.x - z.focus.x, this.player.pos.z - z.focus.z);
      const isNear = this.mode === "follow" && !riding && d < reach;
      it.near += ((isNear ? 1 : 0) - it.near) * Math.min(1, dt * 5);
      if (isNear && d < bd) { bd = d; best = z; }
      it.s.tick({ t: this.t, dt, player: this.player.pos, near: it.near, emit: this.amb.sparks.emit });
      const ring = this.built.rings.get(z.id);
      if (ring) {
        ring.mat.opacity = 0.28 + it.near * (0.45 + Math.sin(this.t * 4) * 0.15);
        ring.ring.scale.setScalar(1 + it.near * 0.04 * Math.sin(this.t * 4));
      }
    }
    if (best !== this.near) {
      this.near = best;
      this.on.near?.(best);
    }
    this.player.admiring = !!best && (best.kind === "work" || best.kind === "about" || best.kind === "contact" || best.kind === "atrium");

    // quem está perto conversa
    let talker: Npc | null = null;
    let td = Infinity;
    for (const n of this.npcs) {
      const d = Math.hypot(this.player.pos.x - n.x, this.player.pos.z - n.z);
      const close = this.mode === "follow" && !riding && n.lines.length > 0 && d < n.reach && this.player.morph < 0.5;
      if (close && d < td) { td = d; talker = n; }
      const w = this.talkW.get(n.id) ?? 0;
      const nw = w + ((close ? 1 : 0) - w) * Math.min(1, dt * 4);
      this.talkW.set(n.id, nw);
      n.tick?.(this.t, dt, close ? nw : 0, this.player.pos);
    }
    if (talker !== this.talking) {
      this.talking = talker;
      this.on.chat?.(talker);
    }
    this.player.lookAt = talker && !this.player.moving ? { x: talker.x, z: talker.z } : null;

    for (const s of this.built.signs) {
      s.group.position.y = s.base + Math.sin(this.t * 0.9 + s.phase) * 0.12;
      s.glow.opacity = U.uNight.value * (0.5 + Math.sin(this.t * 1.3 + s.phase) * 0.08);
    }
    this.tickRipples(dt);
    this.amb.clouds.tick(this.t);
    this.amb.cubes.tick(this.t);

    // plataformas, bolhas e estrelas
    this.pads.tick(this.t, dt);
    if (this.mode === "follow" && !riding && !this.player.airborne && this.pads.test(this.player.pos.x, this.player.pos.z)) {
      this.player.launch(this.player.morph > 0.5 ? 11 : 14);
      this.amb.sparks.emit(this.player.root.position.clone().setY(0.3), "#ff9edf", 16, 0.8, 3.4);
      this.on.launch?.();
    }
    const h = this.player.height + (this.player.morph > 0.5 ? -1 : 0);
    const away = new Vector3(1e5, 0, 1e5);
    this.pops.tick(this.t, dt, riding ? away : this.player.pos, h, this.amb.sparks.emit, () => this.on.pop?.());
    this.stars.tick(this.t, riding ? away : this.player.pos, this.player.height, this.amb.sparks.emit, (n) => {
      this.on.star?.(n, this.stars.total);
      if (n >= this.stars.total) this.golden();
    });
    if (this.player.meditating && Math.random() < dt * 4) {
      this.amb.sparks.emit(this.player.root.position.clone().setY(this.player.pos.y + 1.3 + Math.random()), Math.random() > 0.5 ? "#ffe3a0" : "#ffffff", 1, 1.2, 0.25);
    }
    this.amb.bubbles.tick(this.t);

    this.updateCamera(dt);
    this.amb.sparks.tick(dt, this.ih / (2 * this.halfH()));
    this.render();
    this.on.frame?.();
  }

  /** meia altura visível, em unidades do mundo; em retrato, o zoom vale para a largura */
  private halfH() {
    const portrait = Math.max(1, (innerHeight / innerWidth) * 0.72);
    return this.zoom * portrait * ((this.ih * this.pixel) / innerHeight);
  }

  private updateCamera(dt: number) {
    const goal = new Vector3();
    if (this.mode === "attract") {
      const a = this.t * (this.reduced ? 0 : 0.035);
      goal.set(-14 + Math.sin(a) * 26, 0, -18 + Math.cos(a * 1.3) * 22);
    } else {
      // a câmera sobe junto quando o pulo é alto, e vai junto pelo tubo
      if (this.ride) goal.set(this.player.pos.x, this.player.pos.y * 0.85, this.player.pos.z);
      else goal.set(this.player.pos.x, this.player.pos.y * 0.6 + Math.max(0, this.player.height - 1) * 0.55, this.player.pos.z);
      goal.x += this.player.vel.x * 0.18;
      goal.z += this.player.vel.y * 0.18;
      // perto de uma obra, o enquadramento puxa a escultura para dentro
      const fz = this.focusZone ?? (this.player.moving ? null : this.near);
      if (fz) {
        const f = fz.focus;
        const fy = fz.kind === "hill" ? 4.8 : fz.kind === "lookout" ? 3.6 : fz.kind === "pond" ? 0.8 : fz.kind === "garden" || fz.kind === "library" ? 2 : this.focusZone ? 2.8 : 2.2;
        this.nearPull += ((this.focusZone ? 0.55 : 0.4) - this.nearPull) * Math.min(1, dt * 2);
        this.pullTo.set(f.x, fy, f.z);
      } else this.nearPull += (0 - this.nearPull) * Math.min(1, dt * 2);
      goal.lerp(this.pullTo, this.nearPull);
    }
    const zoomGoal = this.mode === "attract" ? (innerWidth < 700 ? 14 : 24) : this.focusZone ? (innerWidth < 700 ? 9.5 : Math.min(this.zoomGoal, 8)) : this.zoomGoal;
    const kz = 1 - Math.exp(-dt * (this.mode === "attract" ? 1 : 2.4));
    this.zoom += (zoomGoal - this.zoom) * kz;

    // o painel aberto empurra o centro de interesse para o lado livre
    const wpc = (2 * this.halfH()) / (this.ih * this.pixel);
    goal.addScaledVector(RIGHT, this.frameOffset.x * wpc);
    goal.addScaledVector(CAM_UP, -this.frameOffset.y * wpc);

    const kt = 1 - Math.exp(-dt * (this.reduced ? 20 : this.mode === "attract" ? 1.2 : 4.5));
    this.target.lerp(goal, kt);

    // enquadramento ortográfico com o canvas um pouco maior que a tela
    const hh = this.halfH();
    const hw = hh * (this.iw / this.ih);
    const cam = this.camera;
    cam.left = -hw; cam.right = hw; cam.top = hh; cam.bottom = -hh;
    cam.updateProjectionMatrix();

    // degraus de um texel, e o resto vai para o CSS
    const wpp = (2 * hh) / this.ih;
    const a = this.target.dot(RIGHT);
    const b = this.target.dot(CAM_UP);
    const sa = Math.round(a / wpp) * wpp;
    const sb = Math.round(b / wpp) * wpp;
    const snapped = this.target.clone().addScaledVector(RIGHT, sa - a).addScaledVector(CAM_UP, sb - b);
    cam.position.copy(snapped).addScaledVector(ISO, DIST);
    cam.lookAt(snapped);
    cam.updateMatrixWorld();
    const fx = (a - sa) / wpp;
    const fy = (b - sb) / wpp;
    this.canvas.style.transform = `translate(${(-fx * this.pixel).toFixed(2)}px, ${(fy * this.pixel).toFixed(2)}px)`;

    U.uViewDir.value.copy(ISO).negate();

    // a sombra acompanha, também em degraus de texel
    const st = (2 * 26) / this.sun.shadow.mapSize.x;
    const sx = Math.round(snapped.x / st) * st;
    const sz = Math.round(snapped.z / st) * st;
    this.sun.target.position.set(sx, 0, sz);
    this.sun.position.set(sx, 0, sz).addScaledVector(SUN_DIR, 60);
    this.sun.target.updateMatrixWorld();
  }

  private render() {
    const r = this.renderer;
    r.shadowMap.needsUpdate = true;

    if (this.reflEnabled) {
      // câmera espelhada no plano y = 0
      const c = this.camera;
      const rc = this.reflCam;
      rc.left = c.left; rc.right = c.right; rc.top = c.top; rc.bottom = c.bottom;
      rc.near = c.near; rc.far = c.far;
      rc.updateProjectionMatrix();
      rc.position.copy(c.position).setY(-c.position.y);
      const fwd = new Vector3();
      c.getWorldDirection(fwd);
      fwd.y = -fwd.y;
      rc.up.set(0, 1, 0).applyQuaternion(c.quaternion);
      rc.up.y = -rc.up.y;
      rc.lookAt(rc.position.clone().add(fwd));
      rc.updateMatrixWorld();
      U.uReflectMatrix.value
        .set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
        .multiply(rc.projectionMatrix)
        .multiply(rc.matrixWorldInverse);

      U.uRes.value.set(this.reflRT.width, this.reflRT.height);
      r.setRenderTarget(this.reflRT);
      r.render(this.scene, rc);
    }
    U.uReflect.value = this.reflEnabled ? this.reflectAmt : 0;

    U.uRes.value.set(this.iw, this.ih);
    r.setRenderTarget(this.rt);
    r.render(this.scene, this.camera);
    r.setRenderTarget(null);
    r.render(this.postScene, this.postCam);
  }

  /* ---------------- tema ---------------- */

  private applyTheme() {
    const t = this.themeT;
    const a = PALETTES.day;
    const b = PALETTES.night;
    const lc = (x: string, y: string, out: Color) => out.set(x).lerp(new Color(y), t);
    lc(a.skyTop, b.skyTop, U.uSkyTop.value);
    lc(a.skyBot, b.skyBot, U.uSkyBot.value);
    lc(a.hemiSky, b.hemiSky, this.hemi.color);
    lc(a.hemiGround, b.hemiGround, this.hemi.groundColor);
    lc(a.sunColor, b.sunColor, this.sun.color);
    this.hemi.intensity = a.hemi + (b.hemi - a.hemi) * t;
    this.sun.intensity = a.sun + (b.sun - a.sun) * t;
    this.reflectAmt = a.reflect + (b.reflect - a.reflect) * t;
    U.uNight.value = t;
    this.renderer.toneMappingExposure = a.exposure + (b.exposure - a.exposure) * t;
    applyTone(t);
    const want: ThemeName = t > 0.5 ? "night" : "day";
    if (want !== this.envFor || !U.uEquirect.value) {
      this.envFor = want;
      setEnvironment(this.envs[want].pmrem);
      U.uEquirect.value = this.envs[want].equi;
    }
  }

  private tickTheme(dt: number) {
    if (this.themeT === this.themeGoal) return;
    const step = dt / 1.4;
    this.themeT = this.themeGoal > this.themeT ? Math.min(this.themeGoal, this.themeT + step) : Math.max(this.themeGoal, this.themeT - step);
    this.applyTheme();
  }

  /* ---------------- tamanho e qualidade ---------------- */

  resize() {
    const W = innerWidth;
    const H = innerHeight;
    if (!this.pixelSet) this.pixel = H < 560 ? 2 : W < 700 ? 2 : 3;
    const p = this.pixel;
    this.iw = Math.ceil(W / p) + 2;
    this.ih = Math.ceil(H / p) + 2;
    this.renderer.setSize(this.iw, this.ih, false);
    Object.assign(this.canvas.style, {
      width: `${this.iw * p}px`,
      height: `${this.ih * p}px`,
      left: `${-p}px`,
      top: `${-p}px`,
    });
    this.rt.setSize(this.iw, this.ih);
    this.reflRT.setSize(Math.ceil(this.iw / 2), Math.ceil(this.ih / 2));
  }

  pixelSet = false;

  /** se o quadro ficar pesado, desliga o espelho, depois engrossa o pixel */
  private adapt(dt: number) {
    this.frameTimes.push(dt);
    if (this.frameTimes.length < 90) return;
    const avg = this.frameTimes.reduce((s, x) => s + x, 0) / this.frameTimes.length;
    this.frameTimes.length = 0;
    if (avg > 0.024 && this.quality > 0) {
      this.quality--;
      if (this.quality === 1) this.reflEnabled = false;
      else if (!this.pixelSet && this.pixel < 4) { this.pixel++; this.resize(); }
    }
  }

  /* ---------------- entrada ---------------- */

  private typing() {
    const a = document.activeElement as HTMLElement | null;
    return !!a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.isContentEditable || !!a.closest("[data-keys-own]"));
  }

  private drive() {
    const k = this.keys;
    if (this.inputLocked || this.typing()) return { x: 0, z: 0, marble: this.marbleLatch, jump: false };
    let sx = 0;
    let sy = 0;
    if (k.has("KeyW") || k.has("ArrowUp")) sy += 1;
    if (k.has("KeyS") || k.has("ArrowDown")) sy -= 1;
    if (k.has("KeyD") || k.has("ArrowRight")) sx += 1;
    if (k.has("KeyA") || k.has("ArrowLeft")) sx -= 1;
    // a tela gira 45° em relação ao mundo
    const x = (sx - sy) * Math.SQRT1_2;
    const z = (-sx - sy) * Math.SQRT1_2;
    const jump = this.jumpQueued;
    this.jumpQueued = false;
    return { x, z, marble: this.marbleLatch || k.has("ShiftLeft") || k.has("ShiftRight"), jump };
  }

  private bindInput() {
    addEventListener("keydown", (e) => {
      if (this.typing()) return;
      // Enter e Espaço num botão focado são do botão
      const a = document.activeElement;
      if ((e.code === "Enter" || e.code === "Space") && a && (a.tagName === "BUTTON" || a.tagName === "A")) return;
      this.keys.add(e.code);
      if (this.mode !== "follow" || this.inputLocked) return;
      if (e.code === "Space") { e.preventDefault(); if (!e.repeat) this.jumpQueued = true; }
      if ((e.code === "KeyE" || e.code === "Enter") && !e.repeat) {
        // um NPC com convite tem a vez; senão, a placa da sala
        if (this.talking?.action) {
          e.preventDefault();
          this.on.npcAction?.(this.talking);
        } else if (this.stationNear) {
          e.preventDefault();
          this.enterTube(this.stationNear);
        } else if (this.near) {
          e.preventDefault();
          this.on.interact?.(this.near);
        }
      }
      if (e.code.startsWith("Arrow")) e.preventDefault();
    });
    addEventListener("keyup", (e) => this.keys.delete(e.code));
    addEventListener("blur", () => this.keys.clear());

    const c = this.canvas;
    c.addEventListener("contextmenu", (e) => e.preventDefault());
    c.addEventListener("pointerdown", (e) => {
      this.pinch.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch.size === 2) {
        const [p1, p2] = [...this.pinch.values()];
        this.pinchDist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        this.pointer = null;
        return;
      }
      if (this.mode !== "follow" || this.inputLocked) return;
      c.setPointerCapture(e.pointerId);
      this.pointer = { id: e.pointerId, x: e.clientX, y: e.clientY, down: performance.now(), moved: false };
      // segurar o dedo faz o boneco seguir
      clearInterval(this.holdTimer);
      this.holdTimer = window.setInterval(() => {
        if (this.pointer && performance.now() - this.pointer.down > 260) this.steerTo(this.pointer.x, this.pointer.y);
      }, 120);
    });
    c.addEventListener("pointermove", (e) => {
      if (this.pinch.has(e.pointerId)) this.pinch.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pinch.size === 2) {
        const [p1, p2] = [...this.pinch.values()];
        const d = Math.hypot(p1.x - p2.x, p1.y - p2.y);
        if (this.pinchDist > 0) this.zoomBy(this.pinchDist / d);
        this.pinchDist = d;
        return;
      }
      if (this.pointer && e.pointerId === this.pointer.id) {
        if (Math.hypot(e.clientX - this.pointer.x, e.clientY - this.pointer.y) > 6) this.pointer.moved = true;
        this.pointer.x = e.clientX;
        this.pointer.y = e.clientY;
      } else if (e.pointerType === "mouse") {
        c.style.cursor = this.pickZone(e.clientX, e.clientY) || this.pickTube(e.clientX, e.clientY) ? "pointer" : "";
      }
    });
    const end = (e: PointerEvent) => {
      this.pinch.delete(e.pointerId);
      if (this.pinch.size < 2) this.pinchDist = 0;
      clearInterval(this.holdTimer);
      const p = this.pointer;
      if (!p || p.id !== e.pointerId) return;
      this.pointer = null;
      const held = performance.now() - p.down > 260;
      if (held) return;
      const tube = this.pickTube(e.clientX, e.clientY);
      if (tube) {
        this.ripple(tube.x, tube.z, tube.tube.color);
        this.enterTube(tube);
        return;
      }
      const zone = this.pickZone(e.clientX, e.clientY);
      if (zone) {
        const s = standPoint(zone);
        this.ripple(s.x, s.z, zone.color);
        this.player.goTo(s.x, s.z, () => {
          this.faceFocus(zone);
          this.on.interact?.(zone);
        });
        this.player.autoMarble = Math.hypot(s.x - this.player.pos.x, s.z - this.player.pos.z) > 16;
        this.on.moveStart?.();
      } else this.steerTo(e.clientX, e.clientY, true);
    };
    c.addEventListener("pointerup", end);
    c.addEventListener("pointercancel", end);
    c.addEventListener("wheel", (e) => {
      e.preventDefault();
      if (this.mode !== "follow") return;
      this.zoomBy(Math.exp(e.deltaY * 0.0012));
    }, { passive: false });
  }

  private zoomBy(k: number) {
    this.zoomGoal = Math.min(22, Math.max(5, this.zoomGoal * k));
    this.zoom = Math.min(22, Math.max(5, this.zoom * k));
  }

  private setRay(cx: number, cy: number) {
    const rect = this.canvas.getBoundingClientRect();
    const nx = ((cx - rect.left) / rect.width) * 2 - 1;
    const ny = -((cy - rect.top) / rect.height) * 2 + 1;
    this.ray.setFromCamera(new Vector2(nx, ny), this.camera);
  }

  /** clicou num tubo ou numa boca: devolve a estação por onde entrar */
  private pickTube(cx: number, cy: number): Station | null {
    this.setRay(cx, cy);
    const meshes = [...this.tubeHits.map((t) => t.mesh), ...this.tubes.hits];
    const hit = this.ray.intersectObjects(meshes, false)[0];
    if (!hit) return null;
    const mouth = this.tubeHits.find((t) => t.mesh === hit.object);
    if (mouth) return mouth.st;
    // no meio do tubo: entra pela ponta mais perto de onde o boneco está
    const tube = this.tubes.tubes.find((t) => t.hit === hit.object)!;
    const p = this.player.pos;
    const [a, b] = tube.ends;
    return Math.hypot(p.x - a.x, p.z - a.z) <= Math.hypot(p.x - b.x, p.z - b.z) ? a : b;
  }

  /* ---------------- os tubos ---------------- */

  /** pede para entrar num tubo: perto, entra já; longe, vira bolinha e vai até a boca */
  enterTube(st: Station) {
    if (this.ride || this.mode !== "follow") return;
    const d = Math.hypot(this.player.pos.x - st.x, this.player.pos.z - st.z);
    if (d < 2.2) { this.startRide(st); return; }
    this.pendingTube = st;
    // a boca é um obstáculo; o alvo é a beira dela, do lado de quem chega
    let ax = this.player.pos.x - st.x;
    let az = this.player.pos.z - st.z;
    const al = Math.hypot(ax, az) || 1;
    ax = st.x + (ax / al) * 1.35;
    az = st.z + (az / al) * 1.35;
    if (!walkable(ax, az)) {
      const hx = st.zone.hub.x - st.x;
      const hz = st.zone.hub.z - st.z;
      const hl = Math.hypot(hx, hz) || 1;
      ax = st.x + (hx / hl) * 1.35;
      az = st.z + (hz / hl) * 1.35;
    }
    this.player.goTo(ax, az);
    this.player.autoMarble = true;
    this.on.moveStart?.();
  }

  private checkTubes() {
    if (this.ride || this.mode !== "follow") return;
    const p = this.player.pos;
    let near: Station | null = null;
    let nd = 3.4;
    for (const st of this.tubes.stations) {
      const d = Math.hypot(p.x - st.x, p.z - st.z);
      if (d < nd) { nd = d; near = st; }
      // a bolinha que encosta na boca é sugada
      // (só quem rola por conta própria; uma rota automática não cai no tubo sem querer)
      const rolling = this.player.morph > 0.5 && this.player.path.length === 0;
      if (this.tubeCooldown <= 0 && !this.player.airborne && d < 1.5 && (rolling || this.pendingTube === st)) {
        this.startRide(st);
        return;
      }
    }
    if (near !== this.stationNear) {
      this.stationNear = near;
      this.on.station?.(near);
    }
  }

  private startRide(st: Station) {
    this.pendingTube = null;
    this.player.stop();
    this.ride = {
      tube: st.tube,
      from: st.end,
      t: 0,
      dur: 0.9 + st.tube.length / 34,
      last: new Vector3(st.x, st.y + 0.6, st.z),
      exit: st.tube.ends[st.end === 0 ? 1 : 0],
    };
    this.zoomBefore = this.zoomGoal;
    this.zoomGoal = Math.max(this.zoomGoal, 11.5);
    const mouth = new Vector3(st.x, st.y + 0.6, st.z);
    this.amb.sparks.emit(mouth, st.tube.color, 16, 0.8, 3);
    this.amb.sparks.emit(mouth, "#ffffff", 10, 0.6, 2.4);
    if (this.stationNear) { this.stationNear = null; this.on.station?.(null); }
    this.on.tube?.("in", st);
  }

  private tickRide(dt: number) {
    const r = this.ride!;
    r.t += dt;
    const k = Math.min(1, r.t / r.dur);
    // acelera ao entrar e freia ao chegar
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const p = r.tube.curve.getPointAt(r.from === 0 ? e : 1 - e);
    const dir = p.clone().sub(r.last);
    const speed = dir.length() / Math.max(dt, 1e-4);
    r.last.copy(p);
    this.player.ride(p, dir.normalize(), speed, dt);
    if (Math.random() < dt * 34) this.amb.sparks.emit(p.clone(), Math.random() > 0.5 ? r.tube.color : "#ffffff", 1, 0.3, 0.2);
    if (k >= 1) this.endRide();
  }

  private endRide() {
    const r = this.ride!;
    this.ride = null;
    const ex = r.exit;
    // sai da boca para o lado de dentro da ilha
    let dx = ex.zone.hub.x - ex.x;
    let dz = ex.zone.hub.z - ex.z;
    const L = Math.hypot(dx, dz) || 1;
    dx /= L;
    dz /= L;
    let x = ex.x + dx * 1.7;
    let z = ex.z + dz * 1.7;
    if (!walkable(x, z)) { x = ex.zone.hub.x; z = ex.zone.hub.z; }
    this.player.leave(x, z, Math.atan2(dx, dz));
    this.tubeCooldown = 1.4;
    this.zoomGoal = this.zoomBefore || this.zoomGoal;
    const mouth = new Vector3(ex.x, ex.y + 1, ex.z);
    this.amb.sparks.emit(mouth, r.tube.color, 18, 0.8, 3.4);
    this.amb.sparks.emit(mouth, "#ffffff", 12, 0.6, 2.6);
    this.on.tube?.("out", ex);
  }

  get riding() { return !!this.ride; }

  private pickZone(cx: number, cy: number): Zone | null {
    this.setRay(cx, cy);
    const hit = this.ray.intersectObjects(this.hits.map((h) => h.mesh), false)[0];
    return hit ? this.hits.find((h) => h.mesh === hit.object)!.zone : null;
  }

  private steerTo(cx: number, cy: number, tap = false) {
    this.setRay(cx, cy);
    const o = this.ray.ray.origin;
    const d = this.ray.ray.direction;
    // interseção com o chão; na colina, refina algumas vezes
    let y = 0;
    let px = 0;
    let pz = 0;
    for (let i = 0; i < 5; i++) {
      const t = (y - o.y) / d.y;
      px = o.x + d.x * t;
      pz = o.z + d.z * t;
      y = groundY(px, pz);
    }
    if (!walkable(px, pz)) {
      // caiu fora: anda até o ponto andável mais próximo na direção do clique
      const from = this.player.pos;
      let best: { x: number; z: number } | null = null;
      for (let k = 1; k <= 24; k++) {
        const f = 1 - k / 25;
        const qx = from.x + (px - from.x) * f;
        const qz = from.z + (pz - from.z) * f;
        if (walkable(qx, qz)) { best = { x: qx, z: qz }; break; }
      }
      if (!best) return;
      px = best.x;
      pz = best.z;
    }
    this.player.goTo(px, pz);
    this.player.autoMarble = false;
    this.pendingTube = null;
    if (tap) {
      this.ripple(px, pz);
      this.amb.sparks.emit(new Vector3(px, groundY(px, pz) + 0.2, pz), "#ffffff", 3, 0.5, 1.2);
    }
    this.on.moveStart?.();
  }

  private faceFocus(zn: Zone) {
    this.player.face(zn.focus.x, zn.focus.z);
  }
}
