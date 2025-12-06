import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SidebarState {
  desktopOpen: boolean;
  mobileOpen: boolean;
  setDesktopOpen: (open: boolean) => void;
  setMobileOpen: (open: boolean) => void;
  toggleDesktop: () => void;
  toggleMobile: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      desktopOpen: true,
      mobileOpen: false,
      setDesktopOpen: (open) => set({ desktopOpen: open }),
      setMobileOpen: (open) => set({ mobileOpen: open }),
      toggleDesktop: () => set({ desktopOpen: !get().desktopOpen }),
      toggleMobile: () => set({ mobileOpen: !get().mobileOpen }),
    }),
    {
      name: "sidebar",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
