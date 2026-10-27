"use client";

import styled from "styled-components";

// Inline preview stacked above the response that holds the anchor
export const Section = styled.section`
  display: flex;
  flex-direction: column;
  margin: 1.2rem 0 0.4rem ${(props) => props.theme.ledgerGutter};
  padding: 0.6rem 1.2rem 0.4rem;
  background: ${(props) => props.theme.paneRaised};
  border: 1px solid ${(props) => props.theme.lineStrong};
  border-left: 3px solid ${(props) => props.theme.anchorALinkColor};
  border-radius: ${(props) => props.theme.radiusControl};

  /* Nested previews sit flush inside their parent */
  & & {
    margin-left: 0;
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    margin-left: 0;
  }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Title = styled.span`
  font-size: 1.2rem;
  color: ${(props) => props.theme.textMuted};
`;

export const CloseButton = styled.button`
  padding: 0.2rem 0.8rem;
  background: transparent;
  color: ${(props) => props.theme.textSecondary};
  border: none;
  border-radius: ${(props) => props.theme.radiusChip};
  font-size: 1.2rem;
  cursor: pointer;

  &:hover {
    background: ${(props) => props.theme.hover};
    color: ${(props) => props.theme.textPrimary};
  }
`;

export const Loading = styled.div`
  padding: 1rem 0;
  font-size: 1.3rem;
  color: ${(props) => props.theme.textSecondary};
`;
