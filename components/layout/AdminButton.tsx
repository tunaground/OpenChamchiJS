"use client";

import Link from "next/link";
import styled from "styled-components";

const Button = styled(Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border-radius: 0.8rem;
  color: ${(props) => props.theme.topBarText};
  opacity: ${(props) => (props.$active ? 1 : 0.8)};
  background: ${(props) => (props.$active ? props.theme.topBarHover : "transparent")};
  transition: background 0.15s, opacity 0.15s;

  &:hover {
    background: ${(props) => props.theme.topBarHover};
    opacity: 1;
  }

  svg {
    width: 2rem;
    height: 2rem;
  }
`;

interface AdminButtonProps {
  active?: boolean;
}

export function AdminButton({ active }: AdminButtonProps) {
  return (
    <Button href="/admin/boards" aria-label="Admin" $active={active}>
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
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    </Button>
  );
}
