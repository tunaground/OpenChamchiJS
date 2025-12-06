"use client";

import { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { useSidebarStore } from "@/lib/store/sidebar";

const Main = styled.main<{ $sidebarOpen: boolean; $compactOnMobile?: boolean }>`
  padding-top: 5.6rem;
  min-height: 100vh;
  transition: margin-left 0.2s ease-in-out;

  @media (min-width: ${(props) => props.theme.breakpoint}) {
    margin-left: ${(props) => (props.$sidebarOpen ? "16.8rem" : "0")};
  }

  ${(props) =>
    props.$compactOnMobile &&
    css`
      @media (max-width: ${props.theme.breakpoint}) {
        margin-left: ${props.$sidebarOpen ? "5.6rem" : "0"};
      }
    `}
`;

const Content = styled.div`
  width: 100%;
`;

interface PageLayoutProps {
  title?: string;
  sidebar?: React.ReactNode;
  rightContent?: React.ReactNode;
  children: React.ReactNode;
  /** 모바일에서 사이드바를 아이콘만 표시하고 본문과 겹치지 않게 함 */
  compactSidebarOnMobile?: boolean;
}

export function PageLayout({
  title,
  sidebar,
  rightContent,
  children,
  compactSidebarOnMobile,
}: PageLayoutProps) {
  const { open: sidebarOpen, toggle: toggleSidebar, setOpen: setSidebarOpen } = useSidebarStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <>
      <TopBar
        title={title}
        onMenuClick={toggleSidebar}
        rightContent={rightContent}
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
        $sidebarOpen={mounted && sidebar ? sidebarOpen : false}
        $compactOnMobile={sidebar ? compactSidebarOnMobile : false}
      >
        <Content>{children}</Content>
      </Main>
    </>
  );
}
