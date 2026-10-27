"use client";

import styled from "styled-components";
import { PageContainer } from "@/components/layout/PageContainer";

const Container = PageContainer;

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
