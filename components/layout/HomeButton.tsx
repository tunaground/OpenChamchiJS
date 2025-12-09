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

interface HomeButtonProps {
  active?: boolean;
}

export function HomeButton({ active }: HomeButtonProps) {
  return (
    <Button href="/" aria-label="Home" $active={active}>
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
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    </Button>
  );
}
