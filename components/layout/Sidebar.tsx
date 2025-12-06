"use client";

import styled from "styled-components";

const Overlay = styled.div<{ $open: boolean }>`
  position: fixed;
  top: 56px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  opacity: ${(props) => (props.$open ? 1 : 0)};
  visibility: ${(props) => (props.$open ? "visible" : "hidden")};
  transition: opacity 0.2s, visibility 0.2s;
  z-index: 90;

  @media (min-width: 768px) {
    display: none;
  }
`;

const SidebarContainer = styled.aside<{ $open: boolean }>`
  position: fixed;
  top: 56px;
  left: 0;
  bottom: 0;
  width: 280px;
  background: ${(props) => props.theme.surface};
  border-right: 1px solid ${(props) => props.theme.surfaceBorder};
  transform: translateX(${(props) => (props.$open ? "0" : "-100%")});
  transition: transform 0.2s ease-in-out;
  z-index: 95;
  overflow-y: auto;

  @media (min-width: 768px) {
    transform: translateX(${(props) => (props.$open ? "0" : "-100%")});
  }
`;

const SidebarContent = styled.div`
  padding: 1rem;
`;

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Sidebar({ open, onClose, children }: SidebarProps) {
  return (
    <>
      <Overlay $open={open} onClick={onClose} />
      <SidebarContainer $open={open}>
        <SidebarContent>{children}</SidebarContent>
      </SidebarContainer>
    </>
  );
}
