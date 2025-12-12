"use client";

import styled from "styled-components";

const Container = styled.div`
  padding: 3.2rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.6rem;
  }
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 1.6rem;
`;

const Description = styled.p`
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  line-height: 1.6;
`;

export function ArchiveHomeContent() {
  return (
    <Container>
      <Title>Archive</Title>
      <Description>
        Select a board from the sidebar to view archived threads.
      </Description>
    </Container>
  );
}
