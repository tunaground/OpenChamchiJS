"use client";

import styled from "styled-components";

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0 0.8rem;
  font-size: 1.3rem;
  color: ${(props) => props.theme.textSecondary};
  white-space: nowrap;

  &::before {
    content: "";
    width: 0.7rem;
    height: 0.7rem;
    border-radius: 50%;
    background: ${(props) => props.theme.success};
  }
`;

interface UserCounterProps {
  count: number;
  title?: string;
}

/** Live viewer count, shown in the page toolbar */
export function UserCounter({ count, title }: UserCounterProps) {
  return (
    <Container title={title} aria-label={title}>
      {count}
    </Container>
  );
}
