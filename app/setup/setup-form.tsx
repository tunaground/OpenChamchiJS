"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import styled from "styled-components";

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: ${(props) => props.theme.textPrimary};
  color: ${(props) => props.theme.background};
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

export function SetupForm() {
  const t = useTranslations("setup");

  return (
    <Button onClick={() => signIn("google", { callbackUrl: "/setup/complete" })}>
      {t("googleButton")}
    </Button>
  );
}
