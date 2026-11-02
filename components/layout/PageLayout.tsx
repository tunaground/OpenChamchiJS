"use client";

import { useState, useEffect, useRef } from "react";
import styled, { useTheme } from "styled-components";
import { useTranslations } from "next-intl";
import { Toolbar } from "./Toolbar";
import { Sidebar } from "./Sidebar";
import { useSidebarStore } from "@/lib/store/sidebar";
import { useResponseOptionsStore } from "@/lib/store/responseOptions";
import { getPageScrollMetrics, scrollPageTo } from "@/lib/utils/page-scroll";

/* Room for the sidebar, which sits on the canvas without a pane */
const Main = styled.main<{ $sidebarOpen: boolean }>`
  padding: ${(props) => props.theme.paneGap};
  padding-left: ${(props) => (props.$sidebarOpen ? props.theme.sidebarWidth : props.theme.paneGap)};
  transition: padding-left 0.2s ease-in-out;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 0;
  }
`;

/**
 * The content pane: a sheet on the canvas, a gap in from every edge, that
 * scrolls with the window. Its top edge shows at the top of the page and its
 * bottom edge at the end; between them the toolbar sticks to the top of the
 * window and the footer follows the content.
 *
 * No `overflow` here: it would stop the toolbar from sticking. Heights are
 * minimums only, since ad scripts (AdSense) write `height: auto !important`
 * on every ancestor of an ad slot.
 */
const Pane = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - ${(props) => props.theme.paneGap} * 2);
  min-height: calc(100dvh - ${(props) => props.theme.paneGap} * 2);
  /* A flat face; the edge reads as glass */
  background: ${(props) => props.theme.pane};
  border-radius: ${(props) => props.theme.radiusPane};
  box-shadow: ${(props) => props.theme.paneGlassShadow};

  /* The lit rim: a gradient ring, brightest at the top left. Above the sticky
     toolbar (z-index 50), which would otherwise cover its sides once stuck */
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 51;
    padding: 1px;
    border-radius: inherit;
    background: ${(props) => props.theme.paneGlassRim};
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    min-height: 100vh;
    min-height: 100dvh;
    border-radius: 0;
    box-shadow: none;

    &::before {
      display: none;
    }
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

/* After the content (below the last response); at the bottom when the content is short */
const Footer = styled.div`
  flex-shrink: 0;
  margin-top: auto;
`;

interface PageLayoutProps {
  title?: string;
  /** Shown before the title as a link, e.g. the board above a thread */
  parent?: { label: string; href: string };
  /** Small text after the title, e.g. a response count */
  subtitle?: React.ReactNode;
  /** Page-specific buttons at the right of the toolbar */
  toolbarActions?: React.ReactNode;
  /** After the content, at the end of the scroll (e.g. the thread composer) */
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
  const footerRef = useRef<HTMLDivElement>(null);
  const hasFooter = !!footer;

  // A growing footer (a longer draft, the preview) grows the page below the
  // view, widening the gap below it by the growth, so if it was at the
  // bottom before, keep it there.
  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    let lastHeight = footer.offsetHeight;
    const observer = new ResizeObserver(() => {
      const height = footer.offsetHeight;
      const growth = height - lastHeight;
      lastHeight = height;
      if (growth <= 0) return;
      const { top, viewport, total } = getPageScrollMetrics();
      const gapBefore = total - (top + viewport) - growth;
      if (gapBefore <= 100) scrollPageTo("bottom", "instant");
    });
    observer.observe(footer);
    return () => observer.disconnect();
  }, [hasFooter]);

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
          onToggle={handleMenuClick}
          toggleLabel={tCommon("toggleSidebar")}
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
            sidebarOpen={effectiveDesktopOpen}
          />
          <Content>
            {children}
            {footer && <Footer ref={footerRef}>{footer}</Footer>}
          </Content>
        </Pane>
      </Main>
    </>
  );
}
