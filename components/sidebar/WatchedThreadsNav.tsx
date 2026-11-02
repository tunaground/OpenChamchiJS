"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { usePushWatchStore } from "@/lib/store/pushWatch";
import { usePushFeatureEnabled } from "@/lib/hooks/usePushFeatureEnabled";
import { useWatchedThreadsSync } from "@/lib/hooks/useWatchedThreadsSync";
import { SidebarTitle, NavList, NavItem, NavLink, NavLabel } from "./SidebarStyles";

const NewMark = styled.span`
  display: flex;
  flex-shrink: 0;
  color: ${(props) => props.theme.accent};
  font-size: 1.2rem;
`;

function threadBase(boardId: string, threadId: number): string {
  return `/trace/${boardId}/${threadId}`;
}

/** Threads the user gets alerts for, as quick links (logged-in users only) */
export function WatchedThreadsNav() {
  const t = useTranslations("push");
  const pathname = usePathname();
  const enabled = usePushFeatureEnabled();
  const { items, ensureLoaded, setHasNew } = usePushWatchStore();

  useEffect(() => {
    if (enabled) ensureLoaded();
  }, [enabled, ensureLoaded]);

  useWatchedThreadsSync(enabled);

  // The thread on screen is being read: drop its mark
  const current = items.find((item) => {
    const base = threadBase(item.boardId, item.threadId);
    return item.hasNew && (pathname === base || pathname.startsWith(`${base}/`));
  });
  useEffect(() => {
    if (current) setHasNew(current.threadId, false);
  }, [current, setHasNew]);

  const visible = items.filter((item) => !item.threadDeleted);
  if (!enabled || visible.length === 0) return null;

  return (
    <>
      <SidebarTitle>{t("sidebarTitle")}</SidebarTitle>
      <NavList>
        {visible.map((item) => {
          const base = threadBase(item.boardId, item.threadId);
          const active = pathname === base || pathname.startsWith(`${base}/`);
          return (
            <NavItem key={item.id} style={{ opacity: item.enabled ? 1 : 0.55 }}>
              <NavLink href={`${base}/recent`} $active={active}>
                <NavLabel>{item.title}</NavLabel>
                {item.hasNew && !active && (
                  <NewMark title={t("sidebarNew")} aria-label={t("sidebarNew")} role="img">
                    <FontAwesomeIcon icon={faCircleExclamation} />
                  </NewMark>
                )}
              </NavLink>
            </NavItem>
          );
        })}
      </NavList>
    </>
  );
}
