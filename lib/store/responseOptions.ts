import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type QuickSubmitKey = "ctrl" | "shift" | "none";

export interface ResponseOptions {
  chatMode: boolean;
  aaMode: boolean;
  previewMode: boolean;
  noupMode: boolean;
  alwaysBottom: boolean;
  quickSubmitKey: QuickSubmitKey;
  sidebarSwipe: boolean;
}

interface ResponseOptionsState extends ResponseOptions {
  setOption: <K extends keyof ResponseOptions>(key: K, value: ResponseOptions[K]) => void;
  toggleOption: (key: keyof ResponseOptions) => void;
  resetOptions: () => void;
}

const defaultOptions: ResponseOptions = {
  chatMode: false,
  aaMode: false,
  previewMode: false,
  noupMode: false,
  alwaysBottom: false,
  quickSubmitKey: "ctrl",
  sidebarSwipe: true,
};

export const useResponseOptionsStore = create<ResponseOptionsState>()(
  persist(
    (set, get) => ({
      ...defaultOptions,
      setOption: (key, value) => set({ [key]: value }),
      toggleOption: (key) => set({ [key]: !get()[key] }),
      resetOptions: () => set(defaultOptions),
    }),
    {
      name: "response-options",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
