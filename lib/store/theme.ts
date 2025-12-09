import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ThemeMode } from "@/lib/theme/themes";

const themeModes: ThemeMode[] = ["light", "grey", "dark"];

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
      toggleMode: () => {
        const currentIndex = themeModes.indexOf(get().mode);
        const nextIndex = (currentIndex + 1) % themeModes.length;
        set({ mode: themeModes[nextIndex] });
      },
    }),
    {
      name: "theme",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
