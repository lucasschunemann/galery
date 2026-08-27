import { create } from "zustand";

export type Theme = "aqua" | "graphite" | "sunset" | "bliss";
export type Rect = { x: number; y: number; w: number; h: number };

export interface WindowState extends Rect {
  id: string;
  appId: string;
  title: string;
  z: number;
  minimized: boolean;
  maximized: boolean;
  restore?: Rect;
  props?: Record<string, unknown>;
  /** genie-effect origin, set when minimizing to the dock */
  genieX?: number;
}

interface OSState {
  booted: boolean;
  windows: WindowState[];
  focusId: string | null;
  zTop: number;
  theme: Theme;
  sound: boolean;
  crt: boolean;
  screensaver: boolean;
  selection: string | null;

  boot: () => void;
  open: (appId: string, props?: Record<string, unknown>) => void;
  close: (id: string) => void;
  focus: (id: string) => void;
  minimize: (id: string, genieX?: number) => void;
  restore: (id: string) => void;
  toggleZoom: (id: string) => void;
  setRect: (id: string, rect: Partial<Rect>) => void;
  setTheme: (t: Theme) => void;
  toggleSound: () => void;
  toggleCRT: () => void;
  setScreensaver: (v: boolean) => void;
  select: (id: string | null) => void;
}

/* ---- app registry metadata (kept here so the dock can read it) ---- */
export interface AppMeta {
  id: string;
  name: string;
  icon: string;
  defaultSize: { w: number; h: number };
  singleton?: boolean;
  inDock?: boolean;
  onDesktop?: boolean;
  minSize?: { w: number; h: number };
}

export const APPS: Record<string, AppMeta> = {
  finder:     { id: "finder",     name: "Galeria",     icon: "finder",     defaultSize: { w: 880, h: 560 }, singleton: true, inDock: true, onDesktop: true },
  project:    { id: "project",    name: "Projeto",     icon: "project",    defaultSize: { w: 760, h: 600 } },
  about:      { id: "about",      name: "Sobre Mim",   icon: "about",      defaultSize: { w: 620, h: 500 }, singleton: true, inDock: true, onDesktop: true },
  playground: { id: "playground", name: "Playground",  icon: "playground", defaultSize: { w: 640, h: 520 }, singleton: true, inDock: true, onDesktop: true },
  terminal:   { id: "terminal",   name: "Terminal",    icon: "terminal",   defaultSize: { w: 600, h: 400 }, singleton: true, inDock: true },
  contact:    { id: "contact",    name: "Contato",     icon: "contact",    defaultSize: { w: 520, h: 470 }, singleton: true, inDock: true, onDesktop: true },
  player:     { id: "player",     name: "AeroTunes",   icon: "player",     defaultSize: { w: 400, h: 330 }, singleton: true, inDock: true },
  trash:      { id: "trash",      name: "Lixeira",     icon: "trash",      defaultSize: { w: 520, h: 380 }, singleton: true, onDesktop: true },
};

let seq = 0;
const uid = () => `w${++seq}`;

/** cascade new windows so they never land exactly on top of each other */
function place(w: number, h: number, count: number): Rect {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(w, vw - 48);
  const height = Math.min(h, vh - 140);
  const step = 26 * (count % 6);
  const x = Math.max(16, Math.round((vw - width) / 2) - 70 + step);
  const y = Math.max(40, Math.round((vh - height) / 2) - 40 + step);
  return { x, y, w: width, h: height };
}

export const useOS = create<OSState>((set, get) => ({
  booted: false,
  windows: [],
  focusId: null,
  zTop: 100,
  theme: "aqua",
  sound: true,
  crt: false,
  screensaver: false,
  selection: null,

  boot: () => set({ booted: true }),

  open: (appId, props) => {
    const meta = APPS[appId];
    if (!meta) return;
    const { windows, zTop } = get();

    if (meta.singleton) {
      const existing = windows.find((w) => w.appId === appId);
      if (existing) {
        set({
          windows: windows.map((w) =>
            w.id === existing.id
              ? { ...w, minimized: false, z: zTop + 1, props: props ?? w.props }
              : w
          ),
          focusId: existing.id,
          zTop: zTop + 1,
        });
        return;
      }
    }

    // reuse an open project window instead of stacking dozens of them
    if (appId === "project") {
      const existing = windows.find((w) => w.appId === "project");
      if (existing) {
        set({
          windows: windows.map((w) =>
            w.id === existing.id
              ? {
                  ...w,
                  minimized: false,
                  z: zTop + 1,
                  props,
                  title: (props?.title as string) ?? w.title,
                }
              : w
          ),
          focusId: existing.id,
          zTop: zTop + 1,
        });
        return;
      }
    }

    const rect = place(meta.defaultSize.w, meta.defaultSize.h, windows.length);
    const id = uid();
    set({
      windows: [
        ...windows,
        {
          id,
          appId,
          title: (props?.title as string) ?? meta.name,
          ...rect,
          z: zTop + 1,
          minimized: false,
          maximized: false,
          props,
        },
      ],
      focusId: id,
      zTop: zTop + 1,
    });
  },

  close: (id) =>
    set((s) => ({
      windows: s.windows.filter((w) => w.id !== id),
      focusId: s.focusId === id ? null : s.focusId,
    })),

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

  minimize: (id, genieX) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id ? { ...w, minimized: true, genieX } : w
      ),
      focusId: s.focusId === id ? null : s.focusId,
    })),

  restore: (id) =>
    set((s) => {
      const z = s.zTop + 1;
      return {
        windows: s.windows.map((w) =>
          w.id === id ? { ...w, minimized: false, z } : w
        ),
        focusId: id,
        zTop: z,
      };
    }),

  toggleZoom: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w;
        if (w.maximized && w.restore) {
          return { ...w, ...w.restore, maximized: false, restore: undefined };
        }
        return {
          ...w,
          maximized: true,
          restore: { x: w.x, y: w.y, w: w.w, h: w.h },
          x: 12,
          y: 34,
          w: window.innerWidth - 24,
          h: window.innerHeight - 34 - 92,
        };
      }),
    })),

  setRect: (id, rect) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, ...rect } : w)),
    })),

  setTheme: (theme) => set({ theme }),
  toggleSound: () => set((s) => ({ sound: !s.sound })),
  toggleCRT: () => set((s) => ({ crt: !s.crt })),
  setScreensaver: (screensaver) => set({ screensaver }),
  select: (selection) => set({ selection }),
}));
