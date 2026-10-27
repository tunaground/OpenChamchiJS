"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "@/lib/theme";
import { ToastProvider } from "@/components/Toast";
import { SiteProvider } from "@/components/layout/SiteContext";

export function Providers({ siteTitle, children }: { siteTitle: string; children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SiteProvider siteTitle={siteTitle}>
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </SiteProvider>
    </SessionProvider>
  );
}
