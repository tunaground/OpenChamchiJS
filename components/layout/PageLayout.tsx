"use client";

import { useState } from "react";
import styled from "styled-components";
import { TopBar } from "./TopBar";
import { Sidebar } from "./Sidebar";

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
  defaultSidebarOpen?: boolean;
}

export function PageLayout({
  title,
  sidebar,
  rightContent,
  children,
  defaultSidebarOpen = true,
}: PageLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(defaultSidebarOpen);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

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
      {sidebar && (
        <Sidebar open={sidebarOpen} onClose={closeSidebar}>
          {sidebar}
        </Sidebar>
      )}
      <Main $sidebarOpen={sidebar ? sidebarOpen : false}>
        <Content>{children}</Content>
      </Main>
    </>
  );
}
