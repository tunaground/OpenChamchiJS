"use client";

import styled, { css } from "styled-components";

/*
 * Responses read as one continuous ledger: the seq number sits large in a left
 * gutter and rows are split by hairlines rather than boxed into cards.
 * The "anchor" variant (inside anchor previews) is compact with an inline seq.
 */

export const Card = styled.article<{ $variant?: "main" | "anchor"; $op?: boolean }>`
  display: grid;
  grid-template-columns: ${(props) => props.theme.ledgerGutter} minmax(0, 1fr);

  ${(props) =>
    props.$variant === "anchor"
      ? css`
          grid-template-columns: minmax(0, 1fr);
          padding: 0.8rem 0;
          & + & {
            border-top: 1px solid ${props.theme.line};
          }
        `
      : css`
          padding: 1.4rem 0 1.6rem;
          border-bottom: 1px solid ${props.theme.line};
        `}

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    grid-template-columns: minmax(0, 1fr);
    padding-top: 1.2rem;
    padding-bottom: 1.2rem;
  }
`;

export const Gutter = styled.button<{ $op?: boolean }>`
  /* Sit on the same baseline as the name line, not flush with its top */
  align-self: baseline;
  padding: 0 1.2rem 0 0;
  border: none;
  background: none;
  font-size: 2rem;
  font-weight: ${(props) => (props.$op ? 500 : 300)};
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-align: right;
  color: ${(props) => (props.$op ? props.theme.accent : props.theme.textMuted)};
  cursor: pointer;
  transition: color 0.15s;

  &:hover {
    color: ${(props) => props.theme.accent};
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

export const Main = styled.div`
  align-self: baseline;
  min-width: 0;
`;

export const Header = styled.div`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.2rem 1rem;
  font-size: 1.4rem;
`;

/** Inline seq: always in anchor previews, and on mobile where the gutter hides */
export const Seq = styled.button<{ $inline?: "always" | "mobile"; $op?: boolean }>`
  display: ${(props) => (props.$inline === "always" ? "inline" : "none")};
  padding: 0;
  border: none;
  background: none;
  font-size: 1.4rem;
  font-weight: 600;
  color: ${(props) => (props.$op ? props.theme.accent : props.theme.textSecondary)};
  cursor: pointer;

  &:hover {
    color: ${(props) => props.theme.accent};
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: inline;
  }
`;

const clickable = css<{ $clickable?: boolean }>`
  padding: 0;
  border: none;
  background: none;
  font-size: inherit;
  text-align: left;
  word-break: break-all;
  cursor: ${(props) => (props.$clickable ? "pointer" : "default")};

  &:hover {
    text-decoration: ${(props) => (props.$clickable ? "underline" : "none")};
    text-underline-offset: 0.3rem;
  }
`;

export const Username = styled.button<{ $clickable?: boolean }>`
  ${clickable}
  color: ${(props) => props.theme.textPrimary};
  font-weight: 600;
`;

export const AuthorId = styled.button<{ $clickable?: boolean }>`
  ${clickable}
  color: ${(props) => props.theme.textMuted};
  font-size: 1.3rem;
`;

export const Date = styled.time`
  color: ${(props) => props.theme.textMuted};
  font-size: 1.3rem;

  /* Mobile: always on its own second line, after the actions */
  @media (max-width: ${(props) => props.theme.breakpoint}) {
    flex-basis: 100%;
    order: 1;
  }
`;

/** Per-response actions; quiet until the row is hovered or focused on desktop */
export const Actions = styled.span`
  display: flex;
  gap: 0.2rem;
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.12s;

  ${Card}:hover &,
  ${Card}:focus-within & {
    opacity: 1;
  }

  @media (hover: none), (max-width: ${(props) => props.theme.breakpoint}) {
    opacity: 1;
  }
`;

export const Content = styled.div`
  margin-top: 0.6rem;
  font-size: 1.5rem;
  line-height: 1.75;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-word;

  /* TOM styles */
  hr {
    border: none;
    border-top: 1px solid ${(props) => props.theme.line};
    margin: 1.6rem 0;
  }
`;

export const RawContentDisplay = styled.span`
  white-space: pre-wrap;
  font-family: ${(props) => props.theme.fontMono};
  font-size: 1.3rem;
`;

export const Attachment = styled.div`
  margin-top: 0.8rem;
`;
