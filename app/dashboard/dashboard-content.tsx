"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import styled from "styled-components";

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const Card = styled.div`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${(props) => props.theme.textPrimary};
`;

const Welcome = styled.p`
  font-size: 1.125rem;
  margin-bottom: 1rem;
  color: ${(props) => props.theme.textPrimary};
`;

const Info = styled.div`
  padding: 1rem;
  background: ${(props) => props.theme.surfaceHover};
  border-radius: 4px;
  margin-bottom: 1.5rem;

  p {
    color: ${(props) => props.theme.textSecondary};
    font-size: 0.875rem;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: ${(props) => props.theme.textPrimary};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    border-color: ${(props) => props.theme.textSecondary};
  }
`;

interface DashboardContentProps {
  userName: string;
}

export function DashboardContent({ userName }: DashboardContentProps) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");

  return (
    <Container>
      <Card>
        <Title>{t("title")}</Title>
        <Welcome>{t("welcome", { name: userName })}</Welcome>
        <Info>
          <p>{t("protectedMessage")}</p>
        </Info>
        <Button onClick={() => signOut({ callbackUrl: "/login" })}>
          {tCommon("logout")}
        </Button>
      </Card>
    </Container>
  );
}
