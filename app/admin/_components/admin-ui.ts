"use client";

/**
 * Shared building blocks for the admin pages.
 *
 * Every admin screen is a list of hairline-separated rows inside one sunken
 * group, a few outline buttons per row, and modal forms. Keeping the pieces
 * here means the pages only carry the layout that is specific to them.
 */

import styled, { css } from "styled-components";

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export const Container = styled.div`
  width: 100%;
  max-width: ${(props) => props.theme.adminMaxWidth};
  margin: 0 auto;
  padding: 1.6rem 2.4rem 3.2rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.2rem 1.4rem 2.4rem;
  }
`;

/** Small context line above the page content (breadcrumb, intro text) */
export const Breadcrumb = styled.div`
  margin-bottom: 1.2rem;
  padding: 0 0.4rem;
  font-size: 1.3rem;
  color: ${(props) => props.theme.textSecondary};

  a {
    color: ${(props) => props.theme.textSecondary};

    &:hover {
      color: ${(props) => props.theme.accent};
    }
  }
`;

export const Intro = styled.p`
  margin-bottom: 1.6rem;
  padding: 0 0.4rem;
  font-size: 1.4rem;
  line-height: 1.5;
  color: ${(props) => props.theme.textSecondary};
`;

export const ActionsBar = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.6rem;
  flex-wrap: wrap;
`;

export const Section = styled.section`
  & + & {
    margin-top: 2.4rem;
  }
`;

export const SectionTitle = styled.h2`
  margin: 0 0.4rem 0.8rem;
  font-size: 1.3rem;
  font-weight: 500;
  color: ${(props) => props.theme.textMuted};
`;

export const SectionDescription = styled.p`
  margin: -0.4rem 0.4rem 1rem;
  font-size: 1.3rem;
  line-height: 1.5;
  color: ${(props) => props.theme.textMuted};
`;

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  height: 3.4rem;
  padding: 0 1.4rem;
  border-radius: ${(props) => props.theme.radiusControl};
  font-size: 1.4rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.15s ease, filter 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const Button = styled.button`
  ${buttonBase}
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: 1px solid transparent;

  &:hover:not(:disabled) {
    filter: brightness(1.06);
  }
`;

export const SecondaryButton = styled.button`
  ${buttonBase}
  background: transparent;
  color: ${(props) => props.theme.textPrimary};
  border: 1px solid ${(props) => props.theme.lineStrong};

  &:hover:not(:disabled) {
    background: ${(props) => props.theme.hover};
  }
`;

export const DangerButton = styled.button`
  ${buttonBase}
  background: ${(props) => props.theme.error};
  color: white;
  border: 1px solid transparent;

  &:hover:not(:disabled) {
    filter: brightness(1.06);
  }
`;

const smallButtonBase = css`
  display: inline-flex;
  align-items: center;
  height: 2.8rem;
  padding: 0 1rem;
  border-radius: ${(props) => props.theme.radiusControl};
  font-size: 1.3rem;
  white-space: nowrap;
  cursor: pointer;
  background: transparent;
  transition: background 0.15s ease;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const SmallButton = styled.button`
  ${smallButtonBase}
  color: ${(props) => props.theme.textPrimary};
  border: 1px solid ${(props) => props.theme.lineStrong};

  &:hover:not(:disabled) {
    background: ${(props) => props.theme.hover};
  }
`;

export const DangerSmallButton = styled.button`
  ${smallButtonBase}
  color: ${(props) => props.theme.error};
  border: 1px solid color-mix(in srgb, ${(props) => props.theme.error} 45%, transparent);

  &:hover:not(:disabled) {
    background: color-mix(in srgb, ${(props) => props.theme.error} 10%, transparent);
  }
`;

/* ------------------------------------------------------------------ */
/* Badges                                                              */
/* ------------------------------------------------------------------ */

export type BadgeTone = "accent" | "neutral" | "success" | "warning" | "danger";

export const Badge = styled.span<{ $tone?: BadgeTone }>`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  height: 2rem;
  padding: 0 0.6rem;
  border-radius: ${(props) => props.theme.radiusChip};
  font-size: 1.2rem;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid transparent;
  ${(props) => {
    const { theme } = props;
    switch (props.$tone) {
      case "accent":
        return css`
          background: ${theme.accentSoft};
          color: ${theme.accent};
        `;
      case "success":
        return css`
          background: color-mix(in srgb, ${theme.success} 14%, transparent);
          color: ${theme.success};
        `;
      case "warning":
        return css`
          background: color-mix(in srgb, ${theme.warning} 16%, transparent);
          color: ${theme.warning};
        `;
      case "danger":
        return css`
          background: color-mix(in srgb, ${theme.error} 12%, transparent);
          color: ${theme.error};
        `;
      default:
        return css`
          background: ${theme.paneSunken};
          color: ${theme.textSecondary};
          border-color: ${theme.line};
        `;
    }
  }}
`;

export const Code = styled.code`
  font-family: ${(props) => props.theme.fontMono};
  font-size: 0.92em;
  padding: 0.1rem 0.5rem;
  border-radius: ${(props) => props.theme.radiusChip};
  background: ${(props) => props.theme.paneSunken};
  border: 1px solid ${(props) => props.theme.line};
  color: ${(props) => props.theme.textSecondary};
`;

export const Muted = styled.span`
  color: ${(props) => props.theme.textMuted};
`;

/* ------------------------------------------------------------------ */
/* Grouped lists                                                       */
/* ------------------------------------------------------------------ */

export const List = styled.div`
  border: 1px solid ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusControl};
  background: ${(props) => props.theme.paneSunken};
`;

export const Item = styled.div<{ $deleted?: boolean }>`
  padding: 1.2rem 1.4rem;

  & + & {
    border-top: 1px solid ${(props) => props.theme.line};
  }

  ${(props) =>
    props.$deleted &&
    css`
      & > * {
        opacity: 0.55;
      }
    `}

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.2rem;
  }
`;

export const ItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.2rem;
  margin-bottom: 0.4rem;
`;

export const ItemTitle = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.6rem;
  min-width: 0;
  font-size: 1.5rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-word;

  a {
    color: ${(props) => props.theme.textPrimary};

    &:hover {
      color: ${(props) => props.theme.accent};
    }
  }
`;

export const ItemMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.2rem;
  font-size: 1.3rem;
  color: ${(props) => props.theme.textMuted};
`;

export const ItemActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  margin-top: 1rem;
`;

export const Badges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  flex-shrink: 0;
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 4.8rem 1.6rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  border: 1px dashed ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusControl};
`;

/* ------------------------------------------------------------------ */
/* Form controls                                                       */
/* ------------------------------------------------------------------ */

const fieldBase = css<{ $error?: boolean }>`
  width: 100%;
  border: 1px solid ${(props) => (props.$error ? props.theme.error : props.theme.line)};
  border-radius: ${(props) => props.theme.radiusControl};
  font-size: 1.4rem;
  background: ${(props) => props.theme.paneSunken};
  color: ${(props) => props.theme.textPrimary};
  transition: border-color 0.15s ease;

  &:focus {
    outline: none;
    border-color: ${(props) => (props.$error ? props.theme.error : props.theme.accent)};
  }

  &::placeholder {
    color: ${(props) => props.theme.textMuted};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Input = styled.input<{ $error?: boolean }>`
  ${fieldBase}
  height: 3.6rem;
  padding: 0 1rem;
`;

export const Textarea = styled.textarea<{ $error?: boolean }>`
  ${fieldBase}
  min-height: 15rem;
  padding: 0.8rem 1rem;
  line-height: 1.5;
  resize: vertical;
  font-family: inherit;
`;

export const Select = styled.select<{ $error?: boolean }>`
  ${fieldBase}
  height: 3.6rem;
  padding: 0 0.8rem;
  cursor: pointer;
`;

export const SearchForm = styled.form`
  display: flex;
  gap: 0.6rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    width: 100%;
  }
`;

export const SearchInput = styled.input<{ $error?: boolean }>`
  ${fieldBase}
  flex: 1;
  width: 26rem;
  height: 3.4rem;
  padding: 0 1rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    width: auto;
    min-width: 0;
  }
`;

export const SearchSelect = styled.select<{ $error?: boolean }>`
  ${fieldBase}
  width: auto;
  height: 3.4rem;
  padding: 0 0.8rem;
  cursor: pointer;
`;

export const SearchButton = styled(SecondaryButton)`
  flex-shrink: 0;
`;

export const FormGroup = styled.div`
  margin-bottom: 1.6rem;
`;

export const Label = styled.label`
  display: block;
  margin-bottom: 0.6rem;
  font-size: 1.3rem;
  font-weight: 500;
  color: ${(props) => props.theme.textSecondary};
`;

export const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;

  input {
    width: 1.6rem;
    height: 1.6rem;
    accent-color: ${(props) => props.theme.accent};
  }

  label {
    color: ${(props) => props.theme.textPrimary};
    font-size: 1.4rem;
    font-weight: 400;
  }
`;

export const ErrorText = styled.span`
  display: block;
  margin-top: 0.4rem;
  font-size: 1.2rem;
  color: ${(props) => props.theme.error};
`;

/* ------------------------------------------------------------------ */
/* Modals                                                              */
/* ------------------------------------------------------------------ */

export const Modal = styled.div`
  position: fixed;
  inset: 0;
  background: ${(props) => props.theme.scrim};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.6rem;
`;

export const ModalContent = styled.div`
  background: ${(props) => props.theme.paneRaised};
  border: 1px solid ${(props) => props.theme.lineStrong};
  border-radius: ${(props) => props.theme.radiusPane};
  box-shadow: ${(props) => props.theme.paneShadow};
  color: ${(props) => props.theme.textPrimary};
  padding: 2.4rem;
  width: 100%;
  max-width: 50rem;
  max-height: 90vh;
  overflow-y: auto;
  font-size: 1.4rem;
  line-height: 1.5;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 2rem 1.6rem;
  }
`;

export const ModalTitle = styled.h2`
  margin-bottom: 1.6rem;
  font-size: 1.8rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-word;
`;

export const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  margin-top: 2.4rem;
`;
