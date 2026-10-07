import {
  CanvasTexture,
  EquirectangularReflectionMapping,
  SRGBColorSpace,
  type Texture,
} from "three";

/* ============================================================
   Dia e noite.

   O dia é o céu do Frutiger Aero: azul limpo em cima, um
   horizonte branco e nítido que vira a faixa escura que todo
   cromado dos anos 2000 tinha. A noite é periwinkle, rosa e
   ciano, a paleta dos menus de DVD.
   ============================================================ */

export type ThemeName = "day" | "night";

export interface Palette {
  skyTop: string;
  skyBot: string;
  hemiSky: string;
  hemiGround: string;
  hemi: number;
  sunColor: string;
  sun: number;
  white: string;
  floor: string;
  trunk: string;
  cloud: string;
  porcelain: string;
  reflect: number;
  exposure: number;
}

export const PALETTES: Record<ThemeName, Palette> = {
  day: {
    skyTop: "#4fa6ee",
    skyBot: "#b4dcf8",
    hemiSky: "#d8ecff",
    hemiGround: "#efe6d6",
    hemi: 0.95,
    sunColor: "#fff1dc",
    sun: 3.1,
    white: "#f4f3ef",
    floor: "#fbfbfa",
    trunk: "#eeede9",
    cloud: "#ffffff",
    porcelain: "#ffffff",
    reflect: 0.38,
    exposure: 1,
  },
  night: {
    skyTop: "#120c3f",
    skyBot: "#4b2f9e",
    hemiSky: "#9c8cff",
    hemiGround: "#2b1d66",
    hemi: 0.85,
    sunColor: "#d9c8ff",
    sun: 1.6,
    white: "#a29cf0",
    floor: "#6a63d8",
    trunk: "#5a52c4",
    cloud: "#7a68d8",
    porcelain: "#ece8ff",
    reflect: 0.5,
    exposure: 1.05,
  },
};

/** pseudo-aleatório determinístico, para o mundo ser o mesmo a cada visita */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * O ambiente refletido pelo cromo e pelo vidro, pintado num canvas
 * equiretangular. Não há HDR nenhum carregado da rede.
 */
export function paintEnvironment(name: ThemeName): Texture {
  const W = 512;
  const H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const r = rng(name === "day" ? 7 : 11);

  const sky = g.createLinearGradient(0, 0, 0, H);
  if (name === "day") {
    sky.addColorStop(0, "#1f6fd1");
    sky.addColorStop(0.3, "#5aa9ec");
    sky.addColorStop(0.46, "#c8e7ff");
    sky.addColorStop(0.5, "#ffffff");
    sky.addColorStop(0.505, "#6d7c8a");
    sky.addColorStop(0.56, "#9aa89a");
    sky.addColorStop(0.75, "#cfd8cc");
    sky.addColorStop(1, "#f2f4f0");
  } else {
    sky.addColorStop(0, "#06051c");
    sky.addColorStop(0.28, "#1d1366");
    sky.addColorStop(0.43, "#6c3fd0");
    sky.addColorStop(0.49, "#ff8fe0");
    sky.addColorStop(0.5, "#fff0fb");
    sky.addColorStop(0.505, "#24185e");
    sky.addColorStop(0.62, "#3b2c94");
    sky.addColorStop(1, "#140e3c");
  }
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);

  if (name === "day") {
    // nuvens macias no céu de cima
    for (let i = 0; i < 22; i++) {
      const x = r() * W;
      const y = 40 + r() * 70;
      const rad = 10 + r() * 26;
      const grd = g.createRadialGradient(x, y, 0, x, y, rad);
      grd.addColorStop(0, "rgba(255,255,255,0.85)");
      grd.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = grd;
      g.beginPath();
      g.ellipse(x, y, rad * 1.8, rad, 0, 0, Math.PI * 2);
      g.fill();
    }
    // o sol
    const sun = g.createRadialGradient(150, 46, 0, 150, 46, 40);
    sun.addColorStop(0, "rgba(255,255,255,1)");
    sun.addColorStop(0.25, "rgba(255,252,236,0.95)");
    sun.addColorStop(1, "rgba(255,250,230,0)");
    g.fillStyle = sun;
    g.fillRect(100, 0, 110, 100);
  } else {
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(255,${200 + r() * 55},255,${0.4 + r() * 0.6})`;
      g.fillRect(r() * W, r() * H * 0.45, 1, 1);
    }
  }

  // softboxes: as janelas de estúdio que dão o brilho riscado no cromo
  const boxes = name === "day"
    ? [[60, 70, 46, 22], [250, 60, 30, 40], [380, 78, 56, 16], [470, 40, 20, 34]]
    : [[60, 72, 46, 18], [250, 64, 26, 34], [380, 80, 56, 12]];
  boxes.forEach(([x, y, w, h], i) => {
    g.fillStyle = name === "day" ? "#ffffff" : i % 2 ? "#7ff3ff" : "#ff8be0";
    g.globalAlpha = name === "day" ? 0.95 : 0.9;
    g.fillRect(x, y, w, h);
  });
  g.globalAlpha = 1;

  const t = new CanvasTexture(c);
  t.mapping = EquirectangularReflectionMapping;
  t.colorSpace = SRGBColorSpace;
  return t;
}
