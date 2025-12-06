"use client";

import { ReactNode } from "react";
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
  border-radius: 8px;
  padding: 3.2rem;
  width: 100%;
  max-width: 50rem;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  margin-bottom: 1.6rem;
  color: ${(props) => props.theme.textPrimary};
`;

const Description = styled.p`
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 2.4rem;
  font-size: 1.4rem;
`;

interface SetupContentProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function SetupContent({ title, description, children }: SetupContentProps) {
  return (
    <Container>
      <Card>
        <Title>{title}</Title>
        <Description>{description}</Description>
        {children}
      </Card>
    </Container>
  );
}
