"use client";

import styled, { css } from "styled-components";

const Overlay = styled.div<{ $open: boolean; $compact?: boolean }>`
  position: fixed;
  top: 5.6rem;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  opacity: ${(props) => (props.$open ? 1 : 0)};
  visibility: ${(props) => (props.$open ? "visible" : "hidden")};
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 90;

  @media (min-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }

  ${(props) =>
    props.$compact &&
    css`
      display: none;
    `}
`;

const SidebarContainer = styled.aside<{ $open: boolean; $compact?: boolean }>`
  position: fixed;
  top: 5.6rem;
  left: 0;
  bottom: 0;
  width: 16.8rem;
  background: ${(props) => props.theme.surface};
  border-right: 1px solid ${(props) => props.theme.surfaceBorder};
  transform: translateX(${(props) => (props.$open ? "0" : "-100%")});
  transition: transform 0.2s ease-in-out, width 0.2s ease-in-out;
  z-index: 95;
  overflow-y: auto;

  @media (min-width: ${(props) => props.theme.breakpoint}) {
    transform: translateX(${(props) => (props.$open ? "0" : "-100%")});
  }

  ${(props) =>
    props.$compact &&
    css`
      @media (max-width: ${props.theme.breakpoint}) {
        width: 5.6rem;
        transform: translateX(0);
      }
    `}
`;

const SidebarContent = styled.div<{ $compact?: boolean }>`
  padding: 1.6rem;

  ${(props) =>
    props.$compact &&
    css`
      @media (max-width: ${props.theme.breakpoint}) {
        padding: 0.8rem;
      }
    `}
`;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** 모바일에서 아이콘만 표시하고 본문과 겹치지 않게 함 */
  compactOnMobile?: boolean;
}

export function Sidebar({ open, onClose, children, compactOnMobile }: SidebarProps) {
  return (
    <>
      <Overlay $open={open} $compact={compactOnMobile} onClick={onClose} />
      <SidebarContainer $open={open} $compact={compactOnMobile}>
        <SidebarContent $compact={compactOnMobile}>{children}</SidebarContent>
      </SidebarContainer>
    </>
  );
}
