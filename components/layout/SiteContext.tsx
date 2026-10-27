"use client";

import { createContext, useContext } from "react";

interface SiteInfo {
  siteTitle: string;
}

const SiteContext = createContext<SiteInfo>({ siteTitle: "" });

export function SiteProvider({ siteTitle, children }: SiteInfo & { children: React.ReactNode }) {
  return <SiteContext.Provider value={{ siteTitle }}>{children}</SiteContext.Provider>;
}

export const useSite = () => useContext(SiteContext);
