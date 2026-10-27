"use client";

import styled from "styled-components";

const Container = styled.div`
  width: 100%;
  max-width: ${(props) => props.theme.contentMaxWidth};
  margin: 0 auto;
  padding: 1.6rem 2.4rem 3.2rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.2rem 1.4rem 2.4rem;
  }
`;

const Description = styled.p`
  padding: 0 0.4rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  line-height: 1.6;
`;

export function ArchiveHomeContent() {
  return (
    <Container>
      <Description>
        Select a board from the sidebar to view archived threads.
      </Description>
    </Container>
  );
}
