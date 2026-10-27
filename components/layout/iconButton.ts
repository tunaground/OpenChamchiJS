import { css } from "styled-components";

/** Square icon button used in the sidebar footer, toolbar and composer */
export const iconButtonCss = css<{ $active?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 3.2rem;
  height: 3.2rem;
  padding: 0;
  border: none;
  border-radius: ${(props) => props.theme.radiusControl};
  background: ${(props) => (props.$active ? props.theme.accentSoft : "transparent")};
  color: ${(props) => (props.$active ? props.theme.accent : props.theme.textSecondary)};
  cursor: pointer;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${(props) => (props.$active ? props.theme.accentSoft : props.theme.hover)};
    color: ${(props) => (props.$active ? props.theme.accent : props.theme.textPrimary)};
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  svg {
    width: 1.8rem;
    height: 1.8rem;
  }
`;
