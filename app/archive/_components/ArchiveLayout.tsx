"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { useTheme } from "styled-components";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSidebarStore } from "@/lib/store/sidebar";
import { useResponseOptionsStore } from "@/lib/store/responseOptions";
import { ArchiveBoardListSidebar } from "./ArchiveBoardListSidebar";
import { ArchiveTopBar } from "./ArchiveTopBar";

const Main = styled.main<{ $desktopOpen: boolean }>`
  padding-top: 5.6rem;
  min-height: 100vh;
  transition: margin-left 0.2s ease-in-out;

  @media (min-width: ${(props) => props.theme.breakpoint}) {
    margin-left: ${(props) => (props.$desktopOpen ? "16.8rem" : "0")};
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    margin-left: 0;
  }
`;

const Content = styled.div`
  width: 100%;
`;

interface ArchiveBoard {
  id: string;
  name: string;
}

interface ArchiveLayoutProps {
  title?: string;
  boards: ArchiveBoard[];
  children: React.ReactNode;
}

export function ArchiveLayout({ title, boards, children }: ArchiveLayoutProps) {
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

  useEffect(() => {
    setMounted(true);

    const breakpoint = parseInt(theme.breakpoint, 10);
    const checkMobile = () => setIsMobile(window.innerWidth <= breakpoint);

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, [theme.breakpoint]);

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

      if (absDeltaX > 50 && absDeltaX > absDeltaY * 1.2) {
        if (deltaX > 0) {
          setMobileOpen(true);
        } else {
          setMobileOpen(false);
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

  const closeSidebar = () => {
    setMobileOpen(false);
  };

  const effectiveDesktopOpen = mounted ? desktopOpen : true;
  const effectiveMobileOpen = mounted ? mobileOpen : false;
  const sidebarOpen = isMobile ? effectiveMobileOpen : effectiveDesktopOpen;

  return (
    <>
      <ArchiveTopBar title={title} onMenuClick={handleMenuClick} />
      {mounted && (
        <Sidebar open={sidebarOpen} onClose={closeSidebar}>
          <ArchiveBoardListSidebar boards={boards} />
        </Sidebar>
      )}
      <Main $desktopOpen={mounted ? desktopOpen : true}>
        <Content>{children}</Content>
      </Main>
    </>
  );
}
