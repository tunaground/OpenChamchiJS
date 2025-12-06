"use client";

import { signIn, signOut } from "next-auth/react";
import styled from "styled-components";

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 6px;
  background: transparent;
  color: ${(props) => props.theme.textPrimary};
  font-size: 1.4rem;
  cursor: pointer;
  transition: background 0.15s;

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

interface AuthButtonProps {
  isLoggedIn: boolean;
  loginLabel: string;
  logoutLabel: string;
}

export function AuthButton({ isLoggedIn, loginLabel, logoutLabel }: AuthButtonProps) {
  if (isLoggedIn) {
    return (
      <Button onClick={() => signOut()}>
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
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        {logoutLabel}
      </Button>
    );
  }

  return (
    <Button onClick={() => signIn()}>
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
          d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
        />
      </svg>
      {loginLabel}
    </Button>
  );
}
