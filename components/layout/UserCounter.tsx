"use client";

import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  background: ${(props) => props.theme.topBarHover};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 0.4rem;
  font-size: 1.3rem;
  color: ${(props) => props.theme.topBarText};
  opacity: 0.9;
`;

const Icon = styled.span`
  display: flex;
  align-items: center;
  font-size: 1.2rem;
`;

const Count = styled.span`
  font-weight: 500;
`;

interface UserCounterProps {
  count: number;
  title?: string;
}

export function UserCounter({ count, title }: UserCounterProps) {
  return (
    <Container title={title}>
      <Icon>
        <FontAwesomeIcon icon={faUser} />
      </Icon>
      <Count>{count}</Count>
    </Container>
  );
}
