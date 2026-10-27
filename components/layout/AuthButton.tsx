"use client";

import { signIn } from "next-auth/react";
import { signOutWithPush } from "@/lib/push/client";
import styled from "styled-components";
import { iconButtonCss } from "./iconButton";

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  height: 3.2rem;
  padding: 0 1rem;
  border: 1px solid ${(props) => props.theme.lineStrong};
  border-radius: ${(props) => props.theme.radiusControl};
  background: transparent;
  color: ${(props) => props.theme.textSecondary};
  font-size: 1.3rem;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${(props) => props.theme.hover};
    color: ${(props) => props.theme.textPrimary};
  }

  svg {
    width: 1.6rem;
    height: 1.6rem;
  }
`;

const ButtonLabel = styled.span``;

// Logged in, the footer also holds the bell and admin icons, so logout is icon-only
const IconButton = styled.button<{ $active?: boolean }>`
  ${iconButtonCss}
`;

interface AuthButtonProps {
  isLoggedIn: boolean;
  loginLabel: string;
  logoutLabel: string;
}

export function AuthButton({ isLoggedIn, loginLabel, logoutLabel }: AuthButtonProps) {
  if (isLoggedIn) {
    return (
      <IconButton onClick={() => signOutWithPush()} title={logoutLabel} aria-label={logoutLabel}>
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
      </IconButton>
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
      <ButtonLabel>{loginLabel}</ButtonLabel>
    </Button>
  );
}
