import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ThemeMode } from "@/lib/theme/themes";

/** What the user picked; "system" follows the OS color scheme (light or dark) */
export type ThemePreference = ThemeMode | "system";

const cycle: ThemeMode[] = ["light", "grey", "dark"];

/** The mode the theme button switches to from the one shown now */
export function nextThemeMode(resolved: ThemeMode): ThemeMode {
  return cycle[(cycle.indexOf(resolved) + 1) % cycle.length];
}

interface ThemeState {
  mode: ThemePreference;
  setMode: (mode: ThemePreference) => void;
  /** Step light → grey → dark, starting from what is shown now */
  toggleMode: (resolved: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "light",
      setMode: (mode) => set({ mode }),
      toggleMode: (resolved) => set({ mode: nextThemeMode(resolved) }),
    }),
    {
      name: "theme",
      // v1 adds "system"; older saved values (light/grey/dark) carry over as is
      version: 1,
      storage: createJSONStorage(() => localStorage),
      migrate: (persisted) => persisted as ThemeState,
    }
  )
);
