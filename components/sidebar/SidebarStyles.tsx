"use client";

import Link from "next/link";
import styled, { css } from "styled-components";
import { useSidebarContext } from "./SidebarContext";

export const SidebarTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 500;
  color: ${(props) => props.theme.textMuted};
  padding: 0 0.8rem;
  margin: 1.4rem 0 0.4rem;
`;

export const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const NavItem = styled.li`
  margin-bottom: 0.1rem;
`;

/** Shared look for sidebar rows (links and buttons) */
export const navRowCss = css<{ $active?: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  min-width: 0;
  padding: 0.6rem 0.8rem;
  border: none;
  border-radius: ${(props) => props.theme.radiusControl};
  background: ${(props) => (props.$active ? props.theme.accentSoft : "transparent")};
  color: ${(props) =>
    props.$active ? props.theme.accent : props.theme.textSecondary};
  font-size: 1.4rem;
  font-weight: ${(props) => (props.$active ? 500 : 400)};
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  opacity: ${(props) => (props.$disabled ? 0.4 : 1)};
  pointer-events: ${(props) => (props.$disabled ? "none" : "auto")};
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${(props) => (props.$active ? props.theme.accentSoft : props.theme.hover)};
    color: ${(props) => (props.$active ? props.theme.accent : props.theme.textPrimary)};
  }
`;

const StyledNavLink = styled(Link)<{ $active?: boolean; $disabled?: boolean }>`
  ${navRowCss}
`;

export const NavButton = styled.button<{ $active?: boolean; $disabled?: boolean }>`
  ${navRowCss}
`;

export const ExternalNavLink = styled.a<{ $active?: boolean; $disabled?: boolean }>`
  ${navRowCss}

  svg {
    margin-left: auto;
    width: 1.2rem;
    height: 1.2rem;
    opacity: 0.6;
  }
`;

export const NavIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 1.6rem;
  font-size: 1.4rem;
`;

export const NavLabel = styled.span`
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const NavCount = styled.span`
  font-size: 1.2rem;
  color: ${(props) => props.theme.textMuted};
`;

interface NavLinkProps {
  href: string;
  $active?: boolean;
  $disabled?: boolean;
  children: React.ReactNode;
}

export function NavLink({ href, $active, $disabled, children }: NavLinkProps) {
  const sidebarContext = useSidebarContext();

  return (
    <StyledNavLink
      prefetch={false}
      href={href}
      $active={$active}
      $disabled={$disabled}
      aria-disabled={$disabled || undefined}
      onClick={() => sidebarContext?.onClose()}
    >
      {children}
    </StyledNavLink>
  );
}

const StyledBackLink = styled(Link)<{ $active?: boolean; $disabled?: boolean }>`
  ${navRowCss}
  margin-bottom: 0.4rem;
`;

interface BackLinkProps {
  href: string;
  children: React.ReactNode;
}

export function BackLink({ href, children }: BackLinkProps) {
  const sidebarContext = useSidebarContext();

  return (
    <StyledBackLink prefetch={false} href={href} onClick={() => sidebarContext?.onClose()}>
      {children}
    </StyledBackLink>
  );
}

/** Groups are separated by space and a title, not rules */
export const SidebarDivider = styled.div`
  height: 0.6rem;
`;

export const SidebarSection = styled.div`
  margin-top: 0.6rem;
`;

export const SectionTitle = styled(SidebarTitle).attrs({ as: "div" })``;

export const EmptyState = styled.div`
  font-size: 1.3rem;
  color: ${(props) => props.theme.textMuted};
  padding: 0.4rem 0.8rem;
`;

/** External link icon for custom links */
export function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />
    </svg>
  );
}
