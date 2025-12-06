"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import styled from "styled-components";

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.6rem;
`;

const Card = styled.div`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 0.8rem;
  padding: 3.2rem;
  width: 100%;
  max-width: 40rem;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 600;
  margin-bottom: 2.4rem;
  text-align: center;
  color: ${(props) => props.theme.textPrimary};
`;

const Button = styled.button`
  padding: 1.2rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: 0.4rem;
  font-size: 1.6rem;
  font-weight: 500;
  cursor: pointer;
  margin-top: 0.8rem;
  width: 100%;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function LoginPage() {
  const t = useTranslations("login");
  const tCommon = useTranslations("common");
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  if (status === "loading") {
    return (
      <Container>
        <Card>
          <Title>{t("title")}</Title>
        </Card>
      </Container>
    );
  }

  if (session) {
    return (
      <Container>
        <Card>
          <Title>{session.user?.name || session.user?.email}</Title>
          <Button onClick={() => signOut({ callbackUrl: "/" })}>
            {tCommon("logout")}
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <Title>{t("title")}</Title>
        <Button onClick={() => signIn("google", { callbackUrl })}>
          {t("googleButton")}
        </Button>
      </Card>
    </Container>
  );
}
