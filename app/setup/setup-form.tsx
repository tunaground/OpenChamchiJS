"use client";

import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import styled from "styled-components";

const Button = styled.button`
  height: 3.5rem;
  padding: 0 2.4rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: 0.4rem;
  font-size: 1.6rem;
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
