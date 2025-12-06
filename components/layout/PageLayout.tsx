"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";
import { useSidebarStore } from "@/lib/store/sidebar";

const Main = styled.main<{ $sidebarOpen: boolean }>`
  padding-top: 5.6rem;
  min-height: 100vh;
  transition: margin-left 0.2s ease-in-out;

  @media (min-width: ${(props) => props.theme.breakpoint}) {
    margin-left: ${(props) => (props.$sidebarOpen ? "16.8rem" : "0")};
  }
`;

const Content = styled.div`
  width: 100%;
`;

interface PageLayoutProps {
  title?: string;
  sidebar?: React.ReactNode;
  rightContent?: React.ReactNode;
  children: React.ReactNode;
}

export function PageLayout({
  title,
  sidebar,
  rightContent,
  children,
}: PageLayoutProps) {
  const { open: sidebarOpen, toggle: toggleSidebar, setOpen: setSidebarOpen } = useSidebarStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Use default value until hydration is complete to prevent mismatch
  const effectiveSidebarOpen = mounted ? sidebarOpen : true;

  return (
    <>
      <TopBar
        title={title}
        onMenuClick={toggleSidebar}
        rightContent={rightContent}
      />
      {sidebar && (
        <Sidebar open={effectiveSidebarOpen} onClose={closeSidebar}>
          {sidebar}
        </Sidebar>
      )}
      <Main $sidebarOpen={sidebar ? effectiveSidebarOpen : false}>
        <Content>{children}</Content>
      </Main>
    </>
  );
}
