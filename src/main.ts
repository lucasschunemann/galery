import "./style.css";
import { World } from "./world/world";
import { BRIDGES, ZONES, zoneAt, zoneById, type Zone } from "./world/layout";
import { PROJECTS } from "./data/projects";
import { PERSON } from "./data/site";
import { signURL } from "./world/sign";
import { h, icons, svg } from "./ui/dom";
import { logo } from "./ui/logo";
import { aboutView, atriumView, contactView, hillView, projectView, type Nav, type View } from "./ui/content";
import { setMusicTheme, setSound, sfx, soundOn } from "./audio";

/* ============================================================
   Liga o mundo à interface. O mundo avisa quando o boneco
   chega perto de algo, quando começa a andar e quando alguém
   quer ver uma obra; a interface abre e fecha as placas, e o
   som acompanha os dois.
   ============================================================ */

const root = document.documentElement;
const app = document.getElementById("app")!;
const touch = matchMedia("(hover: none)").matches;
root.classList.add("is-intro");

let world: World | null = null;
try {
  world = new World(app);
} catch (err) {
  console.warn("Sem WebGL, a galeria abre como lista.", err);
  root.classList.add("flat");
}

if (import.meta.env.DEV) Object.assign(window, { world });

let entered = false;
let panelZone: Zone | null = null;

/* ---------------- peças pequenas ---------------- */

const kbd = (k: string) => h("span", { class: "kbd" }, k);
const hint = (keys: string[], text: string) => h("span", { class: "hint" }, ...keys.map(kbd), h("span", {}, text));
function bead(text: string, color: string, cls = "") {
  const b = h("span", { class: `bead ${cls}` }, text);
  b.style.setProperty("--b", color);
  return b;
}
const zi = (z: Zone) => ZONES.indexOf(z);
const pad = (n: number) => String(n + 1).padStart(2, "0");

/* ---------------- intro ---------------- */

const enterLoud = h("button", { class: "gel gel--lg", type: "button" }, svg(icons.sound), h("span", {}, "Entrar com som"));
const enterQuiet = h("button", { class: "gel gel--lg gel--silver", type: "button" }, h("span", {}, "Entrar sem som"));
const introLogo = logo("rise");
const intro = h("section", { class: "intro", "aria-labelledby": "intro-title" },
  h("div", { class: "intro__top" },
    introLogo,
    h("div", { class: "intro__meta rise" }, h("span", { class: "label" }, "Galeria de trabalho"), h("span", { class: "label" }, "Edição 2026")),
  ),
  h("div", { class: "intro__main" },
    h("p", { class: "intro__kicker label rise" }, `${PERSON.role} · ${PERSON.city}`),
    h("h1", { class: "intro__name t-display", id: "intro-title" }, h("span", { class: "rise" }, "Lucas"), h("span", { class: "rise" }, "Schünemann")),
    h("p", { class: "intro__lede t-lede rise" }, "Seis projetos expostos numa galeria por onde dá para andar. Entre, caminhe até uma obra e leia a placa."),
    h("div", { class: "intro__actions rise" },
      enterLoud,
      enterQuiet,
      touch ? null : h("span", { class: "intro__hint label" }, "ou", kbd("Enter")),
    ),
  ),
  h("div", { class: "intro__foot rise" },
    hint(["W", "A", "S", "D"], "ou clique no chão para andar"),
    hint(["Shift"], "vira bolinha"),
    hint(["C"], "abre o catálogo"),
  ),
);
intro.querySelectorAll<HTMLElement | SVGElement>(".rise").forEach((el, i) => (el.style.animationDelay = `${0.12 + i * 0.07}s`));
app.append(intro);
enterLoud.addEventListener("click", () => enter(true));
enterQuiet.addEventListener("click", () => enter(false));

/* ---------------- HUD de cima ---------------- */

const tab = (cls: string, label: string, ...kids: (Node | string | null)[]) =>
  h("button", { class: `tab ${cls}`, type: "button", "aria-label": label, title: label }, ...kids);

const catTab = tab("", "Catálogo", svg(icons.grid), h("span", { class: "hide-sm" }, "Catálogo"));
const aboutTab = tab("hide-sm", "Sobre", "Sobre");
const contactTab = tab("hide-sm", "Contato", "Contato");
const themeTab = tab("tab--icon", "Dia ou noite");
const soundTab = tab("tab--icon", "Som", svg(icons.sound));
const pxTab = tab("tab--px hide-sm", "Tamanho do pixel");

const brand = h("button", { class: "brand glass", type: "button", "aria-label": "Voltar ao átrio" },
  logo(),
  h("span", { class: "brand__sep" }),
  h("span", { class: "brand__txt" }, h("b", {}, PERSON.name), h("span", {}, `${PERSON.role} · ${PERSON.city}`)),
);
const top = h("header", { class: "hud hud--top" },
  brand,
  h("div", { class: "hud__right" },
    h("nav", { class: "dock glass", "aria-label": "Seções" }, catTab, aboutTab, contactTab),
    h("div", { class: "dock glass" }, themeTab, soundTab, pxTab),
  ),
);
app.append(top);

brand.addEventListener("click", () => goTo("atrio"));
catTab.addEventListener("click", () => (catalog.classList.contains("is-open") ? closeCatalog() : openCatalog()));
aboutTab.addEventListener("click", () => goTo("sobre"));
contactTab.addEventListener("click", () => goTo("contato"));
themeTab.addEventListener("click", () => {
  const night = (world?.theme ?? root.dataset.theme) !== "night";
  if (world) world.setTheme(night ? "night" : "day");
  else root.dataset.theme = night ? "night" : "day";
  setMusicTheme(night ? "night" : "day");
  sfx.theme(night);
  syncButtons();
});
soundTab.addEventListener("click", () => {
  setSound(!soundOn());
  syncButtons();
});
pxTab.addEventListener("click", () => {
  if (!world) return;
  const steps = [2, 3, 4];
  const n = steps[(steps.indexOf(world.pixel) + 1) % steps.length];
  world.pixelSet = true;
  world.setPixel(n);
  sfx.pixel(n);
  syncButtons();
});

function syncButtons() {
  const night = (world?.theme ?? root.dataset.theme) === "night";
  themeTab.innerHTML = night ? icons.moon : icons.sun;
  themeTab.setAttribute("aria-label", night ? "Trocar para o dia" : "Trocar para a noite");
  soundTab.setAttribute("aria-pressed", String(soundOn()));
  soundTab.setAttribute("aria-label", soundOn() ? "Desligar o som" : "Ligar o som");
  root.classList.toggle("is-sound", soundOn());
  pxTab.textContent = `${world?.pixel ?? 1}×`;
  catTab.setAttribute("aria-current", String(catalog.classList.contains("is-open")));
  aboutTab.setAttribute("aria-current", String(panelZone?.id === "sobre"));
  contactTab.setAttribute("aria-current", String(panelZone?.id === "contato"));
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", night ? "#1c1356" : "#cfe9fb");
}

/* ---------------- HUD de baixo ---------------- */

const keysToggle = h("button", { class: "gel gel--silver gel--icon keys__toggle", type: "button", "aria-label": "Mostrar os controles" }, h("span", {}, "?"));
const keys = h("div", { class: "keys" },
  h("div", { class: "keys__card glass card" },
    hint(["W", "A", "S", "D"], "andar"),
    hint(["Shift"], "rolar"),
    hint(["Espaço"], "pular"),
    hint(["E"], "ver a placa"),
    hint(["C"], "catálogo"),
    hint(["Esc"], "fechar"),
  ),
  keysToggle,
);
keysToggle.addEventListener("click", () => keys.classList.toggle("is-open"));
let quietTimer = 0;

const roll = h("button", { class: "roll gel gel--lg gel--silver gel--icon", type: "button", "aria-pressed": "false", "aria-label": "Virar bolinha" }, svg(icons.marble));
roll.addEventListener("click", () => {
  if (!world) return;
  world.marbleLatch = !world.marbleLatch;
  roll.setAttribute("aria-pressed", String(world.marbleLatch));
});

const promptBead = h("span", { class: "bead bead--lg" });
const promptTitle = h("b", {});
const prompt = h("button", { class: "prompt glass", type: "button", "aria-live": "polite" },
  promptBead,
  h("span", { class: "prompt__txt" }, promptTitle, h("small", {}, touch ? "toque para ver a placa" : "ver a placa")),
  touch ? null : kbd("E"),
);
prompt.addEventListener("click", () => world?.near && openPanel(world.near));

/* o minimapa é uma projeção isométrica de verdade, como a tela */
const mx = (x: number, z: number) => (x - z) * Math.SQRT1_2;
const my = (x: number, z: number) => (x + z) * Math.SQRT1_2 * 0.56;
const NS = "http://www.w3.org/2000/svg";
const sv = (tag: string, attrs: Record<string, string | number>) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
};
const mapSvg = sv("svg", { role: "img", "aria-label": "Mapa da galeria" });
let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
for (const b of BRIDGES) {
  const ax = b.axis === "x" ? b.a.x : b.at;
  const az = b.axis === "x" ? b.at : b.a.z;
  const bx = b.axis === "x" ? b.b.x : b.at;
  const bz = b.axis === "x" ? b.at : b.b.z;
  mapSvg.append(sv("line", { class: "map__b", x1: mx(ax, az), y1: my(ax, az), x2: mx(bx, bz), y2: my(bx, bz) }));
}
const mapZones = new Map<string, SVGGElement>();
for (const z of ZONES) {
  const g = sv("g", { class: "map__z", "data-zone-i": zi(z) }) as SVGGElement;
  g.style.setProperty("--accent-z", z.color);
  const t = z.kind === "hill" ? z.half * 0.8 : z.half;
  const pts = [[-t, -t], [t, -t], [t, t], [-t, t]].map(([dx, dz]) => {
    const px = mx(z.x + dx, z.z + dz);
    const py = my(z.x + dx, z.z + dz);
    minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    return `${px.toFixed(1)},${py.toFixed(1)}`;
  });
  g.append(sv("polygon", { points: pts.join(" ") }));
  const label = sv("text", { x: mx(z.x, z.z), y: my(z.x, z.z) + 1.8, "text-anchor": "middle" });
  label.textContent = z.short;
  const title = sv("title", {});
  title.textContent = z.label;
  g.append(label, title);
  g.addEventListener("click", () => goTo(z.id));
  mapSvg.append(g);
  mapZones.set(z.id, g);
}
const ping = sv("circle", { class: "map__ping", r: 3 });
const me = sv("circle", { class: "map__me", r: 2.6 });
mapSvg.append(ping, me);
const padM = 6;
mapSvg.setAttribute("viewBox", `${minX - padM} ${minY - padM} ${maxX - minX + padM * 2} ${maxY - minY + padM * 2}`);
const mapHere = h("span", { class: "label" }, "Átrio");
const map = h("div", { class: "map glass card" }, h("div", { class: "map__cap" }, h("span", { class: "label" }, "Mapa"), mapHere), mapSvg);

const bottom = h("div", { class: "hud hud--bottom" }, touch ? roll : keys, prompt, map);
app.append(bottom);

/* ---------------- etiquetas sobre as esculturas ---------------- */

const labels = h("div", { class: "labels", "aria-hidden": "true" });
const tags = new Map<string, HTMLElement>();
for (const z of ZONES) {
  const t = h("div", { class: "tag glass" }, bead(z.short, z.color), z.label);
  tags.set(z.id, t);
  labels.append(t);
}
app.append(labels);

/* ---------------- placa ---------------- */

const panelBead = h("span", { class: "bead bead--lg" });
const panelKicker = h("span", { class: "label" });
const panelMeta = h("span", { class: "label" });
const panelClose = h("button", { class: "gel gel--silver gel--sm gel--icon", type: "button", "aria-label": "Fechar a placa" });
panelClose.innerHTML = icons.close;
const panelScroll = h("div", { class: "panel__scroll" });
const panel = h("aside", { class: "panel glass sheet", role: "dialog", "aria-labelledby": "panel-title", "aria-hidden": "true", tabindex: -1 },
  h("header", { class: "sheet__bar" }, panelBead, panelKicker, h("span", { class: "grow" }), panelMeta, panelClose),
  panelScroll,
);
panelClose.addEventListener("click", () => closePanel());
app.append(panel);

const nav: Nav = { go: (id) => goTo(id), catalog: () => openCatalog() };

function viewFor(z: Zone): View {
  if (z.kind === "work") return projectView(z, PROJECTS[z.project!], nav);
  if (z.kind === "about") return aboutView(z, nav);
  if (z.kind === "contact") return contactView(z, sfx);
  if (z.kind === "hill") return hillView(z, nav);
  return atriumView(z, nav);
}

function openPanel(z: Zone) {
  const same = panelZone?.id === z.id && panel.classList.contains("is-open");
  panelZone = z;
  if (!same) {
    const v = viewFor(z);
    panel.style.setProperty("--accent", z.color);
    panelBead.textContent = z.short;
    panelBead.style.setProperty("--b", z.color);
    panelKicker.textContent = v.kicker;
    panelMeta.textContent = v.meta;
    panelScroll.replaceChildren(v.body);
    panelScroll.scrollTop = 0;
    sfx.open(zi(z));
    world?.celebrate(z);
  }
  panel.classList.add("is-open");
  panel.setAttribute("aria-hidden", "false");
  root.classList.add("has-panel");
  if (world) {
    world.focusZone = z;
    requestAnimationFrame(() => {
      const r = panel.getBoundingClientRect();
      if (!world) return;
      if (innerWidth <= 760) world.frameOffset.set(0, r.height / 2);
      else world.frameOffset.set((r.width + 16) / 2, 0);
    });
  }
  history.replaceState(null, "", `#${z.id}`);
  panel.focus({ preventScroll: true });
  syncButtons();
}

function closePanel(sound = true) {
  if (!panel.classList.contains("is-open")) return;
  panel.classList.remove("is-open");
  panel.setAttribute("aria-hidden", "true");
  root.classList.remove("has-panel");
  panelZone = null;
  if (world) {
    world.focusZone = null;
    world.frameOffset.set(0, 0);
  }
  history.replaceState(null, "", location.pathname + location.search);
  if (sound) sfx.close();
  syncButtons();
}

/** leva o boneco até uma sala; a placa abre quando ele chega */
function goTo(id: string) {
  const z = zoneById(id);
  if (!z) return;
  closeCatalog();
  if (!entered) enter(false);
  if (!world) { openPanel(z); return; }
  if (panel.classList.contains("is-open")) openPanel(z);
  world.travelTo(id, (zn) => openPanel(zn));
}

/* ---------------- catálogo ---------------- */

const scrim = h("div", { class: "scrim" });
const catClose = h("button", { class: "gel gel--silver gel--sm gel--icon", type: "button", "aria-label": "Fechar o catálogo" });
catClose.innerHTML = icons.close;
const rows = PROJECTS.map((p, i) => {
  const z = zoneById(p.id)!;
  const b = h("button", { class: "row", type: "button", "data-zone-i": zi(z) },
    h("span", { class: "row__thumb" }, h("img", { src: signURL(z), alt: "", width: 200, height: 124, loading: "lazy" })),
    h("span", { class: "row__t" }, bead(pad(i), p.color), p.title),
    h("span", { class: "row__k" }, `${p.kind} · ${p.client}`),
    h("span", { class: "row__y label" }, p.year),
    h("span", { class: "row__go" }, svg(icons.arrow)),
  );
  b.style.setProperty("--b", p.color);
  b.addEventListener("click", () => goTo(p.id));
  return h("li", {}, b);
});
const extra = (id: string, label: string) => {
  const b = h("button", { class: "gel gel--silver gel--sm", type: "button", "data-zone-i": zi(zoneById(id)!) }, h("span", {}, label));
  b.addEventListener("click", () => goTo(id));
  return b;
};
const catalog = h("div", { class: "catalog glass sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "cat-title", "aria-hidden": "true", "data-keys-own": "" },
  h("header", { class: "sheet__bar" },
    h("div", { class: "catalog__head" },
      h("h2", { class: "t-h2", id: "cat-title" }, "Catálogo"),
      h("p", { class: "t-small" }, "Seis trabalhos, de 2024 a 2026. Escolha um e o boneco vai até a sala."),
    ),
    h("span", { class: "grow" }),
    catClose,
  ),
  h("ul", { class: "catalog__list" }, ...rows),
  h("footer", { class: "catalog__foot" },
    h("div", { class: "links" }, h("span", { class: "label" }, "Outras salas"), extra("atrio", "Átrio"), extra("sobre", "Sobre"), extra("contato", "Contato"), extra("colina", "A colina")),
    touch ? null : hint(["C"], "abre e fecha"),
  ),
);
catClose.addEventListener("click", () => closeCatalog());
scrim.addEventListener("click", () => closeCatalog());
app.append(scrim, catalog);

function openCatalog() {
  if (catalog.classList.contains("is-open")) return;
  toastEl.classList.remove("is-on");
  catalog.classList.add("is-open");
  catalog.setAttribute("aria-hidden", "false");
  scrim.classList.add("is-on");
  if (world) world.inputLocked = true;
  sfx.catalog();
  (catalog.querySelector(".row") as HTMLElement | null)?.focus({ preventScroll: true });
  syncButtons();
}

function closeCatalog() {
  if (!catalog.classList.contains("is-open")) return;
  if (root.classList.contains("flat") && !panelZone) return;
  catalog.classList.remove("is-open");
  catalog.setAttribute("aria-hidden", "true");
  scrim.classList.remove("is-on");
  if (world) world.inputLocked = false;
  (document.activeElement as HTMLElement | null)?.blur();
  syncButtons();
}

/* ---------------- aviso ---------------- */

const toastText = h("span", {});
const toastEl = h("div", { class: "toast glass", role: "status" }, h("span", { class: "bead" }, svg(icons.spark)), toastText);
toastEl.querySelector("svg")!.setAttribute("width", "9");
app.append(toastEl);
let toastTimer = 0;
function toast(msg: string, ms = 5200) {
  toastText.textContent = msg;
  toastEl.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toastEl.classList.remove("is-on"), ms);
}

/* ---------------- entrada ---------------- */

function enter(withSound: boolean) {
  if (entered) return;
  entered = true;
  intro.classList.add("is-out");
  root.classList.remove("is-intro");
  setTimeout(() => intro.remove(), 1100);
  if (withSound) setSound(true);
  syncButtons();
  if (!world) {
    openCatalog();
    return;
  }
  world.enter();
  const hash = decodeURIComponent(location.hash.slice(1));
  if (hash && zoneById(hash)) setTimeout(() => goTo(hash), 1000);
  else setTimeout(() => toast(touch ? "Toque no chão para andar. Segure para seguir o dedo." : "Ande com WASD ou clicando no chão."), 1500);
}

/* ---------------- som da interface ---------------- */

// passar o mouse toca: as salas tocam a sua nota, o resto um tique de vidro
let hovered: Element | null = null;
app.addEventListener("pointerover", (e) => {
  if (e.pointerType !== "mouse") return;
  const t = (e.target as Element).closest(".gel, .tab, .row, .p-nav button, .map__z, .brand");
  if (t === hovered) return;
  hovered = t;
  if (!t) return;
  const i = t.getAttribute("data-zone-i");
  sfx.hover(i === null ? -1 : Number(i));
});
app.addEventListener("click", (e) => {
  if ((e.target as Element).closest(".tab, .gel, .p-nav button, .brand")) sfx.click();
}, true);

/* ---------------- teclado da interface ---------------- */

addEventListener("keydown", (e) => {
  const a = document.activeElement as HTMLElement | null;
  const typing = !!a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA");
  if (!entered) {
    if (e.key === "Enter") { e.preventDefault(); enter(true); }
    return;
  }
  if (e.key === "Escape") {
    if (catalog.classList.contains("is-open")) closeCatalog();
    else if (panel.classList.contains("is-open")) closePanel();
    else keys.classList.remove("is-open");
    return;
  }
  if (typing) return;
  if (e.code === "KeyC" && !e.metaKey && !e.ctrlKey) {
    if (catalog.classList.contains("is-open")) closeCatalog();
    else openCatalog();
  }
});

// clique de mouse num botão não deixa o foco preso nele (Espaço e Enter voltam a ser do boneco)
addEventListener("pointerup", (e) => {
  if (e.pointerType !== "mouse") return;
  const b = (e.target as HTMLElement | null)?.closest("button");
  if (b && !b.closest(".panel, .catalog")) b.blur();
});

addEventListener("hashchange", () => {
  const id = decodeURIComponent(location.hash.slice(1));
  if (id && id !== panelZone?.id && zoneById(id)) goTo(id);
});

/* ---------------- o mundo fala ---------------- */

if (world) {
  const w = world;
  const pos = { x: 0, y: 0, on: false };
  let here = "";
  setMusicTheme(w.theme);
  w.listen({
    near: (z) => {
      prompt.classList.toggle("is-on", !!z && panelZone?.id !== z.id);
      if (z) {
        promptBead.textContent = z.short;
        promptBead.style.setProperty("--b", z.color);
        promptTitle.textContent = z.label;
        sfx.near(zi(z));
      }
      for (const [id, t] of tags) t.classList.toggle("is-near", id === z?.id);
    },
    interact: (z) => openPanel(z),
    moveStart: () => {
      if (panel.classList.contains("is-open")) closePanel();
      toastEl.classList.remove("is-on");
      keys.classList.remove("is-open");
      if (!quietTimer) quietTimer = window.setTimeout(() => keys.classList.add("is-quiet"), 9000);
    },
    step: (s) => sfx.step(s),
    morph: (m) => sfx.marble(m),
    jump: () => sfx.jump(),
    land: (k) => sfx.land(k),
    frame: () => {
      for (const z of ZONES) {
        const t = tags.get(z.id)!;
        w.toScreen(w.anchors.get(z.id)!, pos);
        const hide = !pos.on || panelZone?.id === z.id;
        t.classList.toggle("is-off", hide);
        t.style.transform = `translate3d(${pos.x.toFixed(1)}px, ${pos.y.toFixed(1)}px, 0) translate(-50%, -100%)`;
      }
      const p = w.player.pos;
      const cx = mx(p.x, p.z).toFixed(1);
      const cy = my(p.x, p.z).toFixed(1);
      me.setAttribute("cx", cx);
      me.setAttribute("cy", cy);
      ping.setAttribute("cx", cx);
      ping.setAttribute("cy", cy);
      const zn = zoneAt(p.x, p.z);
      const id = zn?.id ?? "";
      if (id !== here) {
        mapZones.get(here)?.classList.remove("is-here");
        mapZones.get(id)?.classList.add("is-here");
        mapHere.textContent = zn ? zn.label : "Ponte";
        here = id;
      }
      if (panelZone && w.near?.id === panelZone.id) prompt.classList.remove("is-on");
      sfx.roll(w.player.morph > 0.5 ? Math.min(1, w.player.speed / 13.5) : 0);
    },
  });
  w.start();
}

syncButtons();
