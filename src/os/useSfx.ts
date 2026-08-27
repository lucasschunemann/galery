import { useCallback } from "react";
import { useOS } from "./store";
import { SFX, type SfxName } from "./sound";

/** Plays a sound unless the user muted the OS. */
export function useSfx() {
  const sound = useOS((s) => s.sound);
  return useCallback(
    (name: SfxName, ...args: unknown[]) => {
      if (!sound) return;
      try {
        (SFX[name] as (...a: unknown[]) => void)(...args);
      } catch {
        /* audio is a nicety, never a failure mode */
      }
    },
    [sound]
  );
}
