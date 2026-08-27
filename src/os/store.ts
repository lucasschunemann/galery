import { create } from "zustand";

export type Flavour = "graphite" | "paper" | "slate" | "ochre" | "delft";
export type Rect = { x: number; y: number; w: number; h: number };

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  workspace: number;
  /** tiled windows are placed by the layout engine; floating ones carry geometry */
  floating: boolean;
  fx: number; fy: number; fw: number; fh: number;
  z: number;
  props?: Record<string, unknown>;
}

export const WORKSPACES = [1, 2, 3, 4, 5] as const;

export interface AppMeta {
  id: string;
  name: string;
  /** the mono glyph the rail and launcher draw */
  glyph: string;
  keywords: string;
  size: { w: number; h: number };
  singleton?: boolean;
  inRail?: boolean;
}

export const APPS: Record<string, AppMeta> = {
  files:    { id: "files",    name: "Trabalho",  glyph: "▤", keywords: "galeria projetos work portfolio", size: { w: 980, h: 660 }, singleton: true, inRail: true },
  project:  { id: "project",  name: "Projeto",   glyph: "◧", keywords: "caso case estudo",                size: { w: 880, h: 700 } },
  about:    { id: "about",    name: "Sobre",     glyph: "◐", keywords: "sobre bio quem lucas",            size: { w: 660, h: 560 }, singleton: true, inRail: true },
  tokens:   { id: "tokens",   name: "Tokens",    glyph: "◨", keywords: "tema cores paleta flavour",       size: { w: 700, h: 620 }, singleton: true, inRail: true },
  terminal: { id: "terminal", name: "Terminal",  glyph: "▶", keywords: "shell console bash cli",          size: { w: 680, h: 460 }, singleton: true, inRail: true },
  contact:  { id: "contact",  name: "Contato",   glyph: "◇", keywords: "contato email falar",             size: { w: 560, h: 540 }, singleton: true, inRail: true },
  player:   { id: "player",   name: "Áudio",     glyph: "◉", keywords: "musica som player ambient",       size: { w: 440, h: 380 }, singleton: true, inRail: true },
  archive:  { id: "archive",  name: "Arquivo",   glyph: "◫", keywords: "descartado lixo arquivo morto",   size: { w: 620, h: 460 }, singleton: true, inRail: true },
};

interface OSState {
  phase: "boot" | "lock" | "live";
  windows: WindowState[];
  focusId: string | null;
  workspace: number;
  zTop: number;
  flavour: Flavour;
  sound: boolean;
  grain: boolean;
  launcher: boolean;

  setPhase: (p: OSState["phase"]) => void;
  lock: () => void;
  unlock: () => void;

  open: (appId: string, props?: Record<string, unknown>) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  focusCycle: (dir: 1 | -1) => void;
  toggleFloat: (id: string) => void;
  setFloatRect: (id: string, r: Partial<Rect>) => void;
  moveToWorkspace: (id: string, ws: number) => void;

  setWorkspace: (n: number) => void;
  setFlavour: (f: Flavour) => void;
  toggleSound: () => void;
  toggleGrain: () => void;
  setLauncher: (v: boolean) => void;
}

let seq = 0;
const uid = () => `w${++seq}`;

export const useOS = create<OSState>((set, get) => ({
  phase: "boot",
  windows: [],
  focusId: null,
  workspace: 1,
  zTop: 100,
  flavour: "graphite",
  sound: true,
  grain: true,
  launcher: false,

  setPhase: (phase) => set({ phase }),
  lock: () => set({ phase: "lock", launcher: false }),
  unlock: () => set({ phase: "live" }),

  open: (appId, props) => {
    const meta = APPS[appId];
    if (!meta) return;
    const { windows, zTop, workspace } = get();

    // singletons and the project viewer are reused, then pulled to this workspace
    const reusable =
      meta.singleton || appId === "project"
        ? windows.find((w) => w.appId === appId)
        : undefined;

    if (reusable) {
      set({
        windows: windows.map((w) =>
          w.id === reusable.id
            ? {
                ...w,
                workspace,
                z: zTop + 1,
                props: props ?? w.props,
                title: (props?.title as string) ?? w.title,
              }
            : w
        ),
        focusId: reusable.id,
        zTop: zTop + 1,
        launcher: false,
      });
      return;
    }

    const id = uid();
    const vw = typeof window !== "undefined" ? window.innerWidth : 1440;
    const vh = typeof window !== "undefined" ? window.innerHeight : 900;
    const fw = Math.min(meta.size.w, vw - 160);
    const fh = Math.min(meta.size.h, vh - 160);

    set({
      windows: [
        ...windows,
        {
          id,
          appId,
          title: (props?.title as string) ?? meta.name,
          workspace,
          floating: false,
          fx: Math.round((vw - fw) / 2) + ((windows.length % 5) - 2) * 22,
          fy: Math.round((vh - fh) / 2) + ((windows.length % 5) - 2) * 18,
          fw,
          fh,
          z: zTop + 1,
          props,
        },
      ],
      focusId: id,
      zTop: zTop + 1,
      launcher: false,
    });
  },

  close: (id) =>
    set((s) => {
      const rest = s.windows.filter((w) => w.id !== id);
      const sameWs = rest.filter((w) => w.workspace === s.workspace);
      return {
        windows: rest,
        focusId: s.focusId === id ? sameWs[sameWs.length - 1]?.id ?? null : s.focusId,
      };
    }),

  focus: (id) =>
    set((s) => {
      if (s.focusId === id) return s;
      const z = s.zTop + 1;
      return {
        windows: s.windows.map((w) => (w.id === id ? { ...w, z } : w)),
        focusId: id,
        zTop: z,
      };
    }),

  /** alt-tab within the active workspace */
  focusCycle: (dir) => {
    const { windows, workspace, focusId } = get();
    const list = windows.filter((w) => w.workspace === workspace);
    if (!list.length) return;
    const i = list.findIndex((w) => w.id === focusId);
    const next = list[(i + dir + list.length) % list.length];
    get().focus(next.id);
  },

  toggleFloat: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, floating: !w.floating, z: s.zTop + 1 } : w
      ),
      zTop: s.zTop + 1,
      focusId: id,
    })),

  setFloatRect: (id, r) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? { ...w, fx: r.x ?? w.fx, fy: r.y ?? w.fy, fw: r.w ?? w.fw, fh: r.h ?? w.fh }
          : w
      ),
    })),

  moveToWorkspace: (id, ws) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, workspace: ws } : w)),
    })),

  setWorkspace: (workspace) =>
    set((s) => {
      const inWs = s.windows.filter((w) => w.workspace === workspace);
      return { workspace, focusId: inWs[inWs.length - 1]?.id ?? null, launcher: false };
    }),

  setFlavour: (flavour) => set({ flavour }),
  toggleSound: () => set((s) => ({ sound: !s.sound })),
  toggleGrain: () => set((s) => ({ grain: !s.grain })),
  setLauncher: (launcher) => set({ launcher }),
}));

/* ============================================================
   LAYOUT — dwindle, the Hyprland default.

   Each window takes half of what is left, splitting whichever
   side of the remaining region is longer. The result is a
   deterministic binary partition that stays balanced no matter
   how many windows are open.
   ============================================================ */

export function dwindle(area: Rect, count: number, gap: number): Rect[] {
  if (count <= 0) return [];
  const out: Rect[] = [];

  let region = { ...area };
  for (let i = 0; i < count; i++) {
    if (i === count - 1) {
      out.push(region);
      break;
    }
    // the first split favours the master pane; the rest halve evenly
    const ratio = i === 0 ? 0.58 : 0.5;
    const horizontal = region.w >= region.h;

    if (horizontal) {
      const wA = (region.w - gap) * ratio;
      out.push({ x: region.x, y: region.y, w: wA, h: region.h });
      region = {
        x: region.x + wA + gap,
        y: region.y,
        w: region.w - wA - gap,
        h: region.h,
      };
    } else {
      const hA = (region.h - gap) * ratio;
      out.push({ x: region.x, y: region.y, w: region.w, h: hA });
      region = {
        x: region.x,
        y: region.y + hA + gap,
        w: region.w,
        h: region.h - hA - gap,
      };
    }
  }
  return out;
}
