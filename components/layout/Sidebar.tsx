"use client";

import Link from "next/link";
import styled from "styled-components";
import { SidebarContext } from "@/components/sidebar/SidebarContext";
import { WatchedThreadsNav } from "@/components/sidebar/WatchedThreadsNav";
import { useSite } from "./SiteContext";
import { ThemeToggleButton } from "./ThemeToggleButton";
import { SettingsButton } from "./SettingsButton";
import { PushBellButton } from "./PushBellButton";
import { AdminButton } from "./AdminButton";
import { AuthButton } from "./AuthButton";
import { SidebarToggleButton } from "./SidebarToggleButton";

const Overlay = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 0;
  background: ${(props) => props.theme.scrim};
  opacity: ${(props) => (props.$open ? 1 : 0)};
  visibility: ${(props) => (props.$open ? "visible" : "hidden")};
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 90;

  @media (min-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

const Pane = styled.aside<{ $open: boolean }>`
  position: fixed;
  top: ${(props) => props.theme.paneGap};
  bottom: ${(props) => props.theme.paneGap};
  left: ${(props) => props.theme.paneGap};
  width: ${(props) => props.theme.sidebarWidth};
  display: flex;
  flex-direction: column;
  background: ${(props) => props.theme.pane};
  border: 1px solid ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusPane};
  box-shadow: inset 0 1px 0 ${(props) => props.theme.paneEdge}, ${(props) => props.theme.paneShadow};
  color: ${(props) => props.theme.textPrimary};
  transform: translateX(
    ${(props) => (props.$open ? "0" : `calc(-100% - ${props.theme.paneGap} * 2)`)}
  );
  transition: transform 0.2s ease-in-out;
  z-index: 95;
`;

/* Sized and padded like the toolbar, so the toggle lands where the toolbar's
   own toggle sits while the sidebar is closed */
const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: ${(props) => props.theme.toolbarHeight};
  padding: 0.8rem 1rem 0.8rem 0.6rem;

  /* The drawer starts a gap in from the screen's corner, the toolbar right at it */
  @media (max-width: ${(props) => props.theme.breakpoint}) {
    min-height: 3.6rem;
    padding: 0.2rem 1rem 0.2rem 0;
  }
`;

const Home = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  font-size: 1.6rem;
  font-weight: 600;
  letter-spacing: -0.01em;
`;

const HeadTitle = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Scroll = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0.4rem 0.8rem 1.2rem;
`;

const Foot = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.8rem;
  border-top: 1px solid ${(props) => props.theme.line};
`;

const FootEnd = styled.div`
  margin-left: auto;
`;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
  toggleLabel: string;
  children: React.ReactNode;
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: { login: string; logout: string };
  isSettingsPage?: boolean;
  isAdminPage?: boolean;
}

export function Sidebar({
  open,
  onClose,
  onToggle,
  toggleLabel,
  children,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  isSettingsPage,
  isAdminPage,
}: SidebarProps) {
  const { siteTitle } = useSite();

  return (
    <SidebarContext.Provider value={{ onClose }}>
      <Overlay $open={open} onClick={onClose} />
      <Pane $open={open}>
        <Head>
          <SidebarToggleButton onClick={onToggle} label={toggleLabel} />
          <Home prefetch={false} href="/" onClick={onClose}>
            <HeadTitle>{siteTitle}</HeadTitle>
          </Home>
        </Head>
        <Scroll>
          {children}
          {isLoggedIn && <WatchedThreadsNav />}
        </Scroll>
        <Foot>
          <ThemeToggleButton />
          <SettingsButton active={isSettingsPage} />
          {isLoggedIn && <PushBellButton />}
          {canAccessAdmin && <AdminButton active={isAdminPage} />}
          <FootEnd>
            <AuthButton
              isLoggedIn={isLoggedIn}
              loginLabel={authLabels.login}
              logoutLabel={authLabels.logout}
            />
          </FootEnd>
        </Foot>
      </Pane>
    </SidebarContext.Provider>
  );
}
