"use client";

import styled from "styled-components";

const Bar = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: ${(props) => props.theme.surface};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
  display: flex;
  align-items: center;
  padding: 0 1rem;
  z-index: 100;
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  border-radius: 8px;
  cursor: pointer;
  color: ${(props) => props.theme.textPrimary};

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const Title = styled.div`
  font-size: 1.125rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin-left: 0.75rem;
`;

const Spacer = styled.div`
  flex: 1;
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

interface TopBarProps {
  title?: string;
  onMenuClick: () => void;
  rightContent?: React.ReactNode;
}

export function TopBar({ title, onMenuClick, rightContent }: TopBarProps) {
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
      {rightContent && <RightSection>{rightContent}</RightSection>}
    </Bar>
  );
}
