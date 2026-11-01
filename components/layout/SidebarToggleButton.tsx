"use client";

import styled from "styled-components";
import { iconButtonCss } from "./iconButton";

const Button = styled.button<{ $active?: boolean }>`
  ${iconButtonCss}
`;

interface SidebarToggleButtonProps {
  onClick: () => void;
  label: string;
  className?: string;
}

/**
 * Opens and closes the sidebar. Closed, it sits at the start of the toolbar;
 * open, at the start of the sidebar head, on the same spot of the screen, so
 * clicking the same place again undoes it.
 */
export function SidebarToggleButton({ onClick, label, className }: SidebarToggleButtonProps) {
  return (
    <Button type="button" className={className} onClick={onClick} aria-label={label} title={label}>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
        <path strokeLinecap="round" d="M9.5 4.5v15" />
      </svg>
    </Button>
  );
}
