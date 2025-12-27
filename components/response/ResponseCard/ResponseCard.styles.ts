"use client";

import styled from "styled-components";

export const Card = styled.div<{ $variant?: "main" | "anchor" }>`
  background: ${(props) => props.theme.responseCard};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: ${(props) => (props.$variant === "anchor" ? "6px" : "8px")};
  overflow: hidden;
`;

export const Header = styled.div`
  padding: 1.2rem 1.6rem;
  background: ${(props) => props.theme.surfaceHover};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

export const Info = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  font-size: 1.4rem;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
`;

export const Seq = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-weight: 500;
  cursor: pointer;

  &:hover {
    color: ${(props) => props.theme.textPrimary};
  }
`;

export const Username = styled.span<{ $clickable?: boolean }>`
  color: ${(props) => props.theme.textPrimary};
  font-weight: 500;
  word-break: break-all;
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};

  &:hover {
    text-decoration: ${(props) => (props.$clickable ? "underline" : "none")};
  }
`;

export const AuthorId = styled.span<{ $clickable?: boolean }>`
  color: ${(props) => props.theme.textSecondary};
  font-size: 1.2rem;
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};

  &:hover {
    text-decoration: ${(props) => (props.$clickable ? "underline" : "none")};
  }
`;

export const Date = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-size: 1.2rem;
  margin-left: auto;
`;

export const Content = styled.div`
  padding: 1.6rem;
  font-size: 1.5rem;
  line-height: 1.6;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-word;

  /* TOM styles */
  hr {
    border: none;
    border-top: 1px solid ${(props) => props.theme.surfaceBorder};
    margin: 1.6rem 0;
  }
`;

export const RawContentDisplay = styled.span`
  white-space: pre-wrap;
`;

export const Attachment = styled.div`
  padding: 1.6rem 1.6rem 0;
`;
