"use client";

import { useState, useEffect } from "react";
import styled, { css, useTheme } from "styled-components";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { useSidebarStore } from "@/lib/store/sidebar";

const Main = styled.main<{ $desktopOpen: boolean; $mobileOpen: boolean; $compactOnMobile?: boolean }>`
  padding-top: 5.6rem;
  min-height: 100vh;
  transition: margin-left 0.2s ease-in-out;

  @media (min-width: ${(props) => props.theme.breakpoint}) {
    margin-left: ${(props) => (props.$desktopOpen ? "16.8rem" : "0")};
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    margin-left: 0;
  }

  ${(props) =>
    props.$compactOnMobile &&
    css`
      @media (max-width: ${props.theme.breakpoint}) {
        margin-left: ${props.$mobileOpen ? "5.6rem" : "0"};
      }
    `}
`;

const Content = styled.div`
  width: 100%;
`;

interface PageLayoutProps {
  title?: string;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  /** 모바일에서 사이드바를 아이콘만 표시하고 본문과 겹치지 않게 함 */
  compactSidebarOnMobile?: boolean;
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: { login: string; logout: string };
  hideSettings?: boolean;
}

export function PageLayout({
  title,
  sidebar,
  children,
  compactSidebarOnMobile,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  hideSettings,
}: PageLayoutProps) {
  const {
    desktopOpen,
    mobileOpen,
    toggleDesktop,
    toggleMobile,
    setMobileOpen,
  } = useSidebarStore();
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

  // Determine effective open state based on screen size
  const effectiveDesktopOpen = mounted ? desktopOpen : true;
  const effectiveMobileOpen = mounted ? mobileOpen : false;
  const sidebarOpen = isMobile ? effectiveMobileOpen : effectiveDesktopOpen;

  return (
    <>
      <TopBar
        title={title}
        onMenuClick={handleMenuClick}
        isLoggedIn={isLoggedIn}
        canAccessAdmin={canAccessAdmin}
        authLabels={authLabels}
        hideSettings={hideSettings}
      />
      {mounted && sidebar && (
        <Sidebar
          open={sidebarOpen}
          onClose={closeSidebar}
          compactOnMobile={compactSidebarOnMobile}
        >
          {sidebar}
        </Sidebar>
      )}
      <Main
        $desktopOpen={sidebar ? (mounted ? desktopOpen : true) : false}
        $mobileOpen={mounted && sidebar ? mobileOpen : false}
        $compactOnMobile={sidebar ? compactSidebarOnMobile : false}
      >
        <Content>{children}</Content>
      </Main>
    </>
  );
}
