"use client";

import { createContext, useContext } from "react";

interface SidebarContextValue {
  onClose: () => void;
}

export const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarContext() {
  return useContext(SidebarContext);
}
