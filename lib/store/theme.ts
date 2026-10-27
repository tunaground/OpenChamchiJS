import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ThemeMode } from "@/lib/theme/themes";

/** What the user picked; "system" follows the OS color scheme */
export type ThemePreference = ThemeMode | "system";

interface ThemeState {
  mode: ThemePreference;
  setMode: (mode: ThemePreference) => void;
  /** Flip between light and dark, starting from what is shown now */
  toggleMode: (resolved: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "light",
      setMode: (mode) => set({ mode }),
      toggleMode: (resolved) => set({ mode: resolved === "dark" ? "light" : "dark" }),
    }),
    {
      name: "theme",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // v0 had a "grey" theme, which no longer exists
      migrate: (persisted) => {
        const state = persisted as { mode?: string };
        if (state?.mode === "grey") return { ...state, mode: "light" };
        return state as ThemeState;
      },
    }
  )
);
