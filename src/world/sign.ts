import { CanvasTexture, NearestFilter, SRGBColorSpace } from "three";
import { PROJECTS } from "../data/projects";
import type { Zone } from "./layout";

/* ============================================================
   Letreiros: telas azuis com borda tracejada e texto em serifa
   de sistema, pintados num canvas pequeno de propósito. A
   resolução baixa é o que dá o serrilhado de render antigo.
   ============================================================ */

export interface SignSpec {
  bg: string;
  edge: string;
  kicker: string;
  title: string;
  foot?: string;
}

const W = 200;
const H = 124;

function shade(hex: string, k: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) * k));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) * k));
  const b = Math.min(255, Math.max(0, (n & 255) * k));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

/** o que cada sala diz no seu letreiro */
export function signSpec(zn: Zone): SignSpec {
  if (zn.kind === "work") {
    const p = PROJECTS[zn.project!];
    const n = String(zn.project! + 1).padStart(2, "0");
    return { bg: zn.color, edge: "#bff3ff", kicker: `${n} / ${p.kind.toUpperCase()}`, title: zn.label, foot: p.year };
  }
  if (zn.kind === "atrium") return { bg: "#2f3fe0", edge: "#bff3ff", kicker: "GALERIA VON", title: "bem-vindo!", foot: "ande por aqui" };
  if (zn.kind === "about") return { bg: "#1f6f8b", edge: "#9ff6ff", kicker: "SOBRE", title: "Lucas", foot: "blumenau, sc" };
  if (zn.kind === "contact") return { bg: "#16758f", edge: "#9ff6ff", kicker: "CONTATO", title: "telepatia", foot: "ou e-mail" };
  if (zn.kind === "pond") return { bg: "#1288c4", edge: "#bff3ff", kicker: "UM LUGAR PRA PARAR", title: "a lagoa", foot: "escute" };
  if (zn.kind === "arcade") return { bg: "#d9781a", edge: "#fff1b8", kicker: "INSIRA UMA FICHA", title: "fliperama", foot: "recorde: ???" };
  if (zn.kind === "library") return { bg: "#2c4fc9", edge: "#cfe0ff", kicker: "ARTIGOS / 04", title: "a estante", foot: "leia um" };
  if (zn.kind === "garden") return { bg: "#2f8f5a", edge: "#d6ffe6", kicker: "UM LUGAR PRA RESPIRAR", title: "o jardim", foot: "devagar" };
  if (zn.kind === "lookout") return { bg: "#b42f8f", edge: "#ffd6f2", kicker: "UM LUGAR PRA OLHAR", title: "o mirante", foot: "olhe pra cima" };
  return { bg: "#3f9a2c", edge: "#e6ffb8", kicker: "FIM DA GALERIA", title: "obrigado!", foot: "volte sempre" };
}

const urls = new Map<string, string>();
/** o mesmo letreiro, como imagem, para a interface usar */
export function signURL(zn: Zone) {
  let u = urls.get(zn.id);
  if (!u) {
    u = drawSign(signSpec(zn)).toDataURL("image/png");
    urls.set(zn.id, u);
  }
  return u;
}

export function paintSign(spec: SignSpec) {
  const t = new CanvasTexture(drawSign(spec));
  t.colorSpace = SRGBColorSpace;
  t.magFilter = NearestFilter;
  t.minFilter = NearestFilter;
  t.generateMipmaps = false;
  return t;
}

export function drawSign(spec: SignSpec) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.imageSmoothingEnabled = false;

  // fundo com um degradê vertical leve, como tubo de imagem
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, shade(spec.bg, 1.18));
  bg.addColorStop(1, shade(spec.bg, 0.82));
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);

  // linhas de varredura
  g.fillStyle = "rgba(0,0,0,0.07)";
  for (let y = 0; y < H; y += 2) g.fillRect(0, y, W, 1);

  // a borda tracejada
  g.fillStyle = spec.edge;
  for (let x = 4; x < W - 4; x += 6) {
    g.fillRect(x, 3, 3, 2);
    g.fillRect(x, H - 5, 3, 2);
  }
  for (let y = 4; y < H - 4; y += 6) {
    g.fillRect(3, y, 2, 3);
    g.fillRect(W - 5, y, 2, 3);
  }
  g.strokeStyle = spec.edge;
  g.globalAlpha = 0.55;
  g.strokeRect(7.5, 7.5, W - 15, H - 15);
  g.globalAlpha = 1;

  g.fillStyle = "#ffffff";
  g.textBaseline = "alphabetic";
  g.font = "bold 11px 'Courier New', monospace";
  g.globalAlpha = 0.85;
  g.fillText(spec.kicker, 14, 26);
  g.globalAlpha = 1;

  // título em serifa, condensado à força se não couber
  let size = 34;
  g.font = `${size}px 'Times New Roman', Times, serif`;
  const words = spec.title.split(" ");
  const lines: string[] = [];
  if (g.measureText(spec.title).width > W - 28 && words.length > 1) {
    const mid = Math.ceil(words.length / 2);
    lines.push(words.slice(0, mid).join(" "), words.slice(mid).join(" "));
    size = 28;
  } else lines.push(spec.title);
  g.font = `${size}px 'Times New Roman', Times, serif`;
  const top = lines.length > 1 ? 56 : 72;
  lines.forEach((ln, i) => {
    const w = g.measureText(ln).width;
    const sx = Math.min(1, (W - 28) / w);
    g.save();
    g.translate(14, top + i * (size * 0.95));
    g.scale(sx, 1);
    // um eco embaixo, o reflexo das telas da referência
    g.globalAlpha = 0.18;
    g.fillText(ln, 1, 2);
    g.globalAlpha = 1;
    g.fillText(ln, 0, 0);
    g.restore();
  });

  if (spec.foot) {
    g.font = "bold 10px 'Courier New', monospace";
    g.globalAlpha = 0.8;
    g.fillText(spec.foot, 14, H - 16);
    g.globalAlpha = 1;
  }

  return c;
}

/** um halo macio, para os letreiros acenderem à noite */
export function paintGlow() {
  const S = 64;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, "rgba(255,255,255,1)");
  grd.addColorStop(0.35, "rgba(255,255,255,0.45)");
  grd.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  return new CanvasTexture(c);
}

/** a mancha macia embaixo do boneco */
export function paintBlob() {
  const S = 64;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  grd.addColorStop(0, "rgba(0,0,0,1)");
  grd.addColorStop(0.5, "rgba(0,0,0,0.5)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, S, S);
  return new CanvasTexture(c);
}
