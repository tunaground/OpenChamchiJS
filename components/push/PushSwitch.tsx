"use client";

import styled from "styled-components";

const Track = styled.button<{ $checked: boolean }>`
  position: relative;
  flex: none;
  width: 3.4rem;
  height: 1.8rem;
  border: none;
  border-radius: 0.9rem;
  padding: 0;
  cursor: pointer;
  background: ${(props) => (props.$checked ? props.theme.primary : props.theme.textMuted)};
  transition: background 0.15s;

  &::after {
    content: "";
    position: absolute;
    top: 0.2rem;
    left: ${(props) => (props.$checked ? "1.8rem" : "0.2rem")};
    width: 1.4rem;
    height: 1.4rem;
    border-radius: 50%;
    background: #fff;
    transition: left 0.15s;
  }
`;

interface PushSwitchProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}

export function PushSwitch({ checked, label, onChange }: PushSwitchProps) {
  return (
    <Track
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      $checked={checked}
      onClick={() => onChange(!checked)}
    />
  );
}
