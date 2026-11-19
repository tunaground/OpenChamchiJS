import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_FONT, FONT_STORAGE_KEY } from "@/lib/theme/fonts";

interface FontState {
  /** Key of a font in lib/theme/fonts.ts (read it through resolveFont) */
  font: string;
  setFont: (font: string) => void;
}

/** The body/UI font picked in Settings; app/layout.tsx reads the same storage key before paint */
export const useFontStore = create<FontState>()(
  persist(
    (set) => ({
      font: DEFAULT_FONT,
      setFont: (font) => set({ font }),
    }),
    {
      name: FONT_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
    }
  )
);
