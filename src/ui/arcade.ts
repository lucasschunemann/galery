import { h, icons } from "./dom";

/* ============================================================
   Chuva de estrelas: o jogo do fliperama.

   Estrelas caem; você pega com uma barra de cromo. As rosas e
   as azuis valem 10, as douradas valem 50 e caem mais rápido.
   Deixar cair três acaba o jogo. A cada pegada seguida o
   combo sobe, e com ele os pontos. O recorde fica guardado
   neste navegador.

   Tudo é desenhado num canvas de 180×240, ampliado sem
   suavização, com uma fonte de pixel de 3×5 feita aqui mesmo.
   ============================================================ */

export interface ArcadeHooks {
  sound: (kind: "catch" | "gold" | "miss" | "over" | "start", combo?: number) => void;
  lock: (on: boolean) => void;
  record: (score: number) => void;
}

const W = 180;
const H = 240;
const KEY = "von:recorde";

/* a fonte: cada letra são 5 linhas de 3 bits */
const GLYPHS: Record<string, string> = {
  A: "25755", B: "65656", C: "34443", D: "65556", E: "74647", F: "74644", G: "34553", H: "55755",
  I: "72227", J: "11152", K: "55655", L: "44447", M: "57755", N: "65555", O: "25552", P: "65644",
  Q: "25563", R: "65655", S: "34216", T: "72222", U: "55557", V: "55552", W: "55775", X: "55255",
  Y: "55222", Z: "71247", "0": "75557", "1": "26227", "2": "71747", "3": "71317", "4": "55711",
  "5": "74717", "6": "74757", "7": "71111", "8": "75757", "9": "75717", " ": "00000", "!": "22202",
  ":": "02020", "-": "00700", "?": "61202", "<": "12421", ">": "42124", ".": "00002", "/": "11244",
};

function text(g: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, k = 1, align: "left" | "center" | "right" = "left") {
  const str = s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
  const w = str.length * 4 * k - k;
  let cx = align === "center" ? Math.round(x - w / 2) : align === "right" ? x - w : x;
  g.fillStyle = color;
  for (const ch of str) {
    const rows = GLYPHS[ch] ?? GLYPHS["?"];
    for (let r = 0; r < 5; r++) {
      const bits = Number(rows[r]);
      for (let c = 0; c < 3; c++) if (bits & (4 >> c)) g.fillRect(cx + c * k, y + r * k, k, k);
    }
    cx += 4 * k;
  }
}

interface Star { x: number; y: number; v: number; kind: 0 | 1 | 2; spin: number }
interface Bit { x: number; y: number; vx: number; vy: number; life: number; color: string }

export function createArcade(hooks: ArcadeHooks) {
  const canvas = h("canvas", { class: "arcade__screen", width: W, height: H, "aria-label": "Jogo Chuva de estrelas" });
  const g = canvas.getContext("2d")!;
  const close = h("button", { class: "gel gel--silver gel--sm gel--icon", type: "button", "aria-label": "Fechar o jogo" });
  close.innerHTML = icons.close;
  const cab = h("div", { class: "arcade__cab glass sheet", role: "dialog", "aria-modal": "true", "aria-label": "Fliperama", "data-keys-own": "" },
    h("header", { class: "sheet__bar" },
      h("span", { class: "label" }, "Fliperama VON"),
      h("span", { class: "grow" }),
      h("span", { class: "label" }, "Chuva de estrelas"),
      close,
    ),
    h("div", { class: "arcade__bezel" }, canvas),
    h("p", { class: "arcade__help t-small" }, "Setas ou A e D movem a barra. No toque, arraste. Espaço começa."),
  );
  const el = h("div", { class: "arcade", "aria-hidden": "true" }, cab);
  el.addEventListener("click", (e) => { if (e.target === el) hide(); });
  close.addEventListener("click", () => hide());

  let state: "title" | "play" | "over" = "title";
  let px = W / 2;
  let score = 0;
  let lives = 3;
  let combo = 0;
  let clock = 0;
  let spawn = 0;
  let best = 0;
  let fresh = false;
  let stars: Star[] = [];
  let bits: Bit[] = [];
  const keys = new Set<string>();
  let raf = 0;
  let last = 0;
  try { best = Number(localStorage.getItem(KEY) ?? 0) || 0; } catch { /* sem armazenamento */ }

  const sky = Array.from({ length: 40 }, (_, i) => ({ x: (i * 47) % W, y: (i * 89) % H, s: 1 + (i % 3) }));

  function start() {
    state = "play";
    score = 0;
    lives = 3;
    combo = 0;
    clock = 0;
    spawn = 0.4;
    stars = [];
    bits = [];
    fresh = false;
    hooks.sound("start");
  }

  function burst(x: number, y: number, color: string, n = 8) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 30 + Math.random() * 60;
      bits.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, life: 0.5 + Math.random() * 0.3, color });
    }
  }

  function step(dt: number) {
    clock += dt;
    for (const s of sky) {
      s.y += s.s * 8 * dt;
      if (s.y > H) s.y -= H;
    }
    if (state === "play") {
      const dir = (keys.has("ArrowRight") || keys.has("KeyD") ? 1 : 0) - (keys.has("ArrowLeft") || keys.has("KeyA") ? 1 : 0);
      px = Math.max(16, Math.min(W - 16, px + dir * 170 * dt));
      spawn -= dt;
      if (spawn <= 0) {
        const r = Math.random();
        const kind: 0 | 1 | 2 = r < 0.1 ? 2 : r < 0.55 ? 0 : 1;
        stars.push({ x: 10 + Math.random() * (W - 20), y: -6, v: (48 + clock * 2.4) * (kind === 2 ? 1.5 : 1), kind, spin: Math.random() * 6 });
        spawn = Math.max(0.28, 0.8 - clock * 0.012);
      }
      for (const s of stars) s.y += s.v * dt;
      stars = stars.filter((s) => {
        if (s.y > 222 && s.y < 232 && Math.abs(s.x - px) < 18) {
          combo++;
          const pts = (s.kind === 2 ? 50 : 10) * (1 + Math.floor(combo / 5));
          score += pts;
          burst(s.x, 224, s.kind === 2 ? "#ffd23a" : s.kind === 0 ? "#ff7ad9" : "#7ff0ff", s.kind === 2 ? 14 : 8);
          hooks.sound(s.kind === 2 ? "gold" : "catch", combo);
          return false;
        }
        if (s.y > H + 4) {
          lives--;
          combo = 0;
          burst(s.x, H - 4, "#ff4f6a", 5);
          hooks.sound("miss");
          if (lives <= 0) {
            state = "over";
            if (score > best) {
              best = score;
              fresh = true;
              try { localStorage.setItem(KEY, String(best)); } catch { /* fica só nesta visita */ }
              hooks.record(best);
            }
            hooks.sound("over");
          }
          return false;
        }
        return true;
      });
    }
    for (const b of bits) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += 140 * dt;
      b.life -= dt;
    }
    bits = bits.filter((b) => b.life > 0);
  }

  function star(x: number, y: number, color: string, big: boolean) {
    g.fillStyle = color;
    const r = big ? 4 : 3;
    g.fillRect(x - 1, y - r, 2, r * 2);
    g.fillRect(x - r, y - 1, r * 2, 2);
    g.fillStyle = "#ffffff";
    g.fillRect(x - 1, y - 1, 2, 2);
  }

  function draw() {
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#0d0838");
    grd.addColorStop(1, "#3a1f8c");
    g.fillStyle = grd;
    g.fillRect(0, 0, W, H);
    for (const s of sky) {
      g.fillStyle = s.s === 3 ? "#ffffff" : s.s === 2 ? "#a99cff" : "#5c4bc9";
      g.fillRect(s.x | 0, s.y | 0, 1, 1);
    }
    // o chão: uma faixa de ilhas brancas
    g.fillStyle = "#e9e6ff";
    g.fillRect(0, 234, W, 6);
    g.fillStyle = "#b9b2f5";
    for (let x = 0; x < W; x += 12) g.fillRect(x, 234, 6, 1);

    for (const s of stars) star(s.x | 0, s.y | 0, s.kind === 2 ? "#ffd23a" : s.kind === 0 ? "#ff7ad9" : "#7ff0ff", s.kind === 2);
    for (const b of bits) {
      g.fillStyle = b.color;
      g.fillRect(b.x | 0, b.y | 0, 2, 2);
    }

    // a barra de cromo
    const x0 = (px - 16) | 0;
    g.fillStyle = "#ffffff";
    g.fillRect(x0, 226, 32, 2);
    g.fillStyle = "#8fb0d8";
    g.fillRect(x0, 228, 32, 1);
    g.fillStyle = "#1a2842";
    g.fillRect(x0, 229, 32, 1);
    g.fillStyle = "#c9ddf3";
    g.fillRect(x0, 230, 32, 2);

    text(g, String(score).padStart(5, "0"), 6, 6, "#ffffff");
    text(g, `REC ${String(best).padStart(5, "0")}`, W - 6, 6, "#ffd23a", 1, "right");
    for (let i = 0; i < 3; i++) star(8 + i * 9, 20, i < lives ? "#ff7ad9" : "#3b2a7a", false);
    if (combo >= 5 && state === "play") text(g, `COMBO X${1 + Math.floor(combo / 5)}`, W / 2, 20, "#7ff0ff", 1, "center");

    const blink = Math.sin(clock * 5) > -0.2;
    if (state === "title") {
      text(g, "CHUVA DE", W / 2, 70, "#7ff0ff", 2, "center");
      text(g, "ESTRELAS", W / 2, 86, "#ff7ad9", 3, "center");
      text(g, "PEGUE O QUE CAI", W / 2, 124, "#ffffff", 1, "center");
      text(g, "DOURADA VALE 50", W / 2, 134, "#ffd23a", 1, "center");
      if (blink) text(g, "ESPACO PARA COMECAR", W / 2, 168, "#ffffff", 1, "center");
    } else if (state === "over") {
      text(g, "FIM", W / 2, 70, "#ff7ad9", 4, "center");
      text(g, `${score} PONTOS`, W / 2, 104, "#ffffff", 2, "center");
      if (fresh) text(g, "NOVO RECORDE!", W / 2, 126, "#ffd23a", 1, "center");
      if (blink) text(g, "ESPACO DE NOVO", W / 2, 168, "#ffffff", 1, "center");
    }
  }

  function loop(now: number) {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    step(dt);
    draw();
  }

  const onKey = (e: KeyboardEvent) => {
    if (!el.classList.contains("is-open")) return;
    if (e.type === "keyup") { keys.delete(e.code); return; }
    if (e.code === "Escape") { e.stopImmediatePropagation(); hide(); return; }
    e.stopImmediatePropagation();
    keys.add(e.code);
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      if (state !== "play") start();
    }
    if (e.code.startsWith("Arrow")) e.preventDefault();
  };
  addEventListener("keydown", onKey, true);
  addEventListener("keyup", onKey, true);

  // toque e mouse: a barra segue o dedo; tocar começa
  const follow = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    px = Math.max(16, Math.min(W - 16, ((e.clientX - r.left) / r.width) * W));
  };
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId);
    follow(e);
    if (state !== "play") start();
  });
  canvas.addEventListener("pointermove", (e) => { if (e.buttons || e.pointerType === "mouse") follow(e); });

  function open() {
    el.classList.add("is-open");
    el.setAttribute("aria-hidden", "false");
    state = "title";
    stars = [];
    last = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
    hooks.lock(true);
    canvas.focus?.();
  }

  function hide() {
    if (!el.classList.contains("is-open")) return;
    el.classList.remove("is-open");
    el.setAttribute("aria-hidden", "true");
    cancelAnimationFrame(raf);
    keys.clear();
    hooks.lock(false);
  }

  return {
    el,
    open,
    close: hide,
    get best() { return best; },
    get isOpen() { return el.classList.contains("is-open"); },
  };
}
