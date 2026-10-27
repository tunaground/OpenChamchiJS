"use client";

import { useState, useEffect } from "react";
import styled, { useTheme } from "styled-components";
import { useTranslations } from "next-intl";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { useSidebarStore } from "@/lib/store/sidebar";
import { useResponseOptionsStore } from "@/lib/store/responseOptions";
import { PAGE_SCROLL_ID } from "@/lib/utils/page-scroll";

/*
 * Desktop pins the content area with insets rather than `height`: ad scripts
 * (AdSense) write `height: auto !important` inline on every ancestor of an ad
 * slot, which would let the pane grow to its content and scroll the window.
 * With top/bottom/left/right all set, `height: auto` still fills the space.
 */
const Main = styled.main<{ $sidebarOpen: boolean }>`
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: ${(props) =>
    props.$sidebarOpen ? `calc(${props.theme.sidebarWidth} + ${props.theme.paneGap})` : "0"};
  transition: left 0.2s ease-in-out;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    position: static;
  }
`;

/**
 * The content pane. On desktop it is pinned inside Main and only its middle
 * (Scroll) scrolls, so the toolbar, the footer (thread composer) and the pane's
 * edges always show. On mobile the window scrolls and toolbar/footer stick.
 */
const Pane = styled.div`
  position: absolute;
  inset: ${(props) => props.theme.paneGap};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: ${(props) => props.theme.pane};
  border: 1px solid ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusPane};
  box-shadow: inset 0 1px 0 ${(props) => props.theme.paneEdge}, ${(props) => props.theme.paneShadow};

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    position: static;
    min-height: 100vh;
    min-height: 100dvh;
    overflow: visible;
    border: none;
    border-radius: 0;
    box-shadow: none;
  }
`;

const Scroll = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overscroll-behavior: contain;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    overflow-y: visible;
  }
`;

const Footer = styled.div`
  flex-shrink: 0;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    position: sticky;
    bottom: 0;
    z-index: 40;
  }
`;

interface PageLayoutProps {
  title?: string;
  /** Shown before the title as a link, e.g. the board above a thread */
  parent?: { label: string; href: string };
  /** Small text after the title, e.g. a response count */
  subtitle?: React.ReactNode;
  /** Page-specific buttons at the right of the toolbar */
  toolbarActions?: React.ReactNode;
  /** Pinned below the scrolling content (e.g. the thread composer) */
  footer?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: { login: string; logout: string };
  isSettingsPage?: boolean;
  isAdminPage?: boolean;
  userCount?: number;
  userCountTitle?: string;
}

export function PageLayout({
  title,
  parent,
  subtitle,
  toolbarActions,
  footer,
  sidebar,
  children,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  isSettingsPage,
  isAdminPage,
  userCount,
  userCountTitle,
}: PageLayoutProps) {
  const {
    desktopOpen,
    mobileOpen,
    toggleDesktop,
    toggleMobile,
    setMobileOpen,
  } = useSidebarStore();
  const sidebarSwipe = useResponseOptionsStore((state) => state.sidebarSwipe);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const theme = useTheme();
  const tCommon = useTranslations("common");

  useEffect(() => {
    setMounted(true);

    const breakpoint = parseInt(theme.breakpoint, 10);
    const checkMobile = () => setIsMobile(window.innerWidth <= breakpoint);

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [theme.breakpoint]);

  // Swipe gesture handling for mobile sidebar
  useEffect(() => {
    if (!sidebarSwipe || !isMobile) return;

    let startX = 0;
    let startY = 0;
    let swipeAllowed = true;

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest(".no-swipe")) {
        swipeAllowed = false;
        return;
      }
      swipeAllowed = true;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!swipeAllowed) return;
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // 50px threshold, horizontal must be 1.2x vertical
      if (absDeltaX > 50 && absDeltaX > absDeltaY * 1.2) {
        if (deltaX > 0) {
          setMobileOpen(true); // Swipe right = open
        } else {
          setMobileOpen(false); // Swipe left = close
        }
      }
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd);
    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [sidebarSwipe, isMobile, setMobileOpen]);

  const handleMenuClick = () => {
    if (isMobile) {
      toggleMobile();
    } else {
      toggleDesktop();
    }
  };

  // Determine effective open state based on screen size
  const effectiveDesktopOpen = mounted ? desktopOpen : true;
  const effectiveMobileOpen = mounted ? mobileOpen : false;
  const sidebarOpen = isMobile ? effectiveMobileOpen : effectiveDesktopOpen;

  return (
    <>
      {mounted && (
        <Sidebar
          open={sidebarOpen}
          onClose={() => setMobileOpen(false)}
          isLoggedIn={isLoggedIn}
          canAccessAdmin={canAccessAdmin}
          authLabels={authLabels}
          isSettingsPage={isSettingsPage}
          isAdminPage={isAdminPage}
        >
          {sidebar}
        </Sidebar>
      )}
      <Main $sidebarOpen={effectiveDesktopOpen}>
        <Pane>
          <Toolbar
            title={title}
            parent={parent}
            subtitle={subtitle}
            userCount={userCount}
            userCountTitle={userCountTitle}
            actions={toolbarActions}
            onMenuClick={handleMenuClick}
            menuLabel={tCommon("toggleSidebar")}
          />
          <Scroll id={PAGE_SCROLL_ID}>{children}</Scroll>
          {footer && <Footer>{footer}</Footer>}
        </Pane>
      </Main>
    </>
  );
}
