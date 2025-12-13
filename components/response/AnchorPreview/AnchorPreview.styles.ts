"use client";

import styled from "styled-components";

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-bottom: 1.2rem;
  padding: 1.6rem;
  background: ${(props) => props.theme.surfaceHover};
  border: 2px solid ${(props) => props.theme.anchorALinkColor || props.theme.textSecondary};
  border-radius: 8px;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
`;

export const Title = styled.span`
  font-size: 1.4rem;
  font-weight: 500;
  color: ${(props) => props.theme.textSecondary};
`;

export const CloseButton = styled.button`
  padding: 0.4rem 0.8rem;
  background: transparent;
  color: ${(props) => props.theme.textSecondary};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.2rem;
  cursor: pointer;

  &:hover {
    background: ${(props) => props.theme.surface};
  }
`;

export const Loading = styled.div`
  text-align: center;
  padding: 1rem;
  color: ${(props) => props.theme.textSecondary};
`;
