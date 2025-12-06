"use client";

import Link from "next/link";
import styled from "styled-components";

const Container = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
`;

const Card = styled.div`
  text-align: center;
`;

const Code = styled.h1`
  font-size: 6rem;
  font-weight: 700;
  margin: 0;
  line-height: 1;
  color: ${(props) => props.theme.textPrimary};
`;

const Message = styled.p`
  font-size: 1.25rem;
  color: ${(props) => props.theme.textSecondary};
  margin: 1rem 0 2rem;
`;

const StyledLink = styled(Link)`
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.875rem;

  &:hover {
    opacity: 0.9;
  }
`;

interface NotFoundContentProps {
  code: string;
  message: string;
  backHome: string;
}

export function NotFoundContent({ code, message, backHome }: NotFoundContentProps) {
  return (
    <Container>
      <Card>
        <Code>{code}</Code>
        <Message>{message}</Message>
        <StyledLink href="/">{backHome}</StyledLink>
      </Card>
    </Container>
  );
}
