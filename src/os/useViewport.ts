import { useEffect, useState } from "react";

export function useViewport() {
  const [v, setV] = useState(() => ({
    w: typeof window === "undefined" ? 1440 : window.innerWidth,
    h: typeof window === "undefined" ? 900 : window.innerHeight,
  }));
  useEffect(() => {
    const on = () => setV({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return v;
}

export const COMPACT = 820;
export function useCompact() {
  const { w } = useViewport();
  return w < COMPACT;
}
