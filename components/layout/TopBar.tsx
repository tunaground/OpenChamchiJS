"use client";

import styled from "styled-components";
import { HomeButton } from "./HomeButton";
import { ThemeToggleButton } from "./ThemeToggleButton";
import { SettingsButton } from "./SettingsButton";
import { AdminButton } from "./AdminButton";
import { AuthButton } from "./AuthButton";
import { UserCounter } from "./UserCounter";

const Bar = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 5.6rem;
  background: ${(props) => props.theme.surface};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
  display: flex;
  align-items: center;
  padding: 0 1.6rem;
  z-index: 100;
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border: none;
  background: transparent;
  border-radius: 0.8rem;
  cursor: pointer;
  color: ${(props) => props.theme.textPrimary};

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }

  svg {
    width: 2.4rem;
    height: 2.4rem;
  }
`;

const Title = styled.div`
  font-size: 1.8rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin-left: 1.2rem;
`;

const Spacer = styled.div`
  flex: 1;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

interface TopBarProps {
  title?: string;
  onMenuClick: () => void;
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: { login: string; logout: string };
  hideSettings?: boolean;
  userCount?: number;
  userCountTitle?: string;
}

export function TopBar({
  title,
  onMenuClick,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  hideSettings,
  userCount,
  userCountTitle,
}: TopBarProps) {
  return (
    <Bar>
      <MenuButton onClick={onMenuClick} aria-label="Toggle menu">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4 6h16M4 12h16M4 18h16"
          />
        </svg>
      </MenuButton>
      {title && <Title>{title}</Title>}
      <Spacer />
      <RightSection>
        {userCount !== undefined && (
          <UserCounter count={userCount} title={userCountTitle} />
        )}
        <HomeButton />
        <ThemeToggleButton />
        {!hideSettings && <SettingsButton />}
        {canAccessAdmin && <AdminButton />}
        <AuthButton
          isLoggedIn={isLoggedIn}
          loginLabel={authLabels.login}
          logoutLabel={authLabels.logout}
        />
      </RightSection>
    </Bar>
  );
}
