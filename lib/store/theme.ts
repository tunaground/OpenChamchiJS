import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ThemeMode } from "@/lib/theme/themes";

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: "light",
      setMode: (mode) => set({ mode }),
      toggleMode: () =>
        set({ mode: get().mode === "light" ? "dark" : "light" }),
    }),
    {
      name: "theme",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
