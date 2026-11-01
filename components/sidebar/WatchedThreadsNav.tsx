"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePushWatchStore } from "@/lib/store/pushWatch";
import { usePushFeatureEnabled } from "@/lib/hooks/usePushFeatureEnabled";
import { SidebarTitle, NavList, NavItem, NavLink, NavLabel } from "./SidebarStyles";

/** Threads the user gets alerts for, as quick links (logged-in users only) */
export function WatchedThreadsNav() {
  const t = useTranslations("push");
  const pathname = usePathname();
  const enabled = usePushFeatureEnabled();
  const { items, ensureLoaded } = usePushWatchStore();

  useEffect(() => {
    if (enabled) ensureLoaded();
  }, [enabled, ensureLoaded]);

  const visible = items.filter((item) => !item.threadDeleted);
  if (!enabled || visible.length === 0) return null;

  return (
    <>
      <SidebarTitle>{t("sidebarTitle")}</SidebarTitle>
      <NavList>
        {visible.map((item) => {
          const base = `/trace/${item.boardId}/${item.threadId}`;
          const active = pathname === base || pathname.startsWith(`${base}/`);
          return (
            <NavItem key={item.id} style={{ opacity: item.enabled ? 1 : 0.55 }}>
              <NavLink href={`${base}/recent`} $active={active}>
                <NavLabel>{item.title}</NavLabel>
              </NavLink>
            </NavItem>
          );
        })}
      </NavList>
    </>
  );
}
