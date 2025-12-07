"use client";

import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faFont,
  faEye,
  faArrowUp,
  faArrowDown,
} from "@fortawesome/free-solid-svg-icons";
import { ResponseOptions } from "@/lib/store/responseOptions";

const Container = styled.div`
  display: flex;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
`;

const OptionButton = styled.button<{ $active: boolean; $overridden?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.2rem;
  height: 3.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 0.4rem;
  background: ${(props) =>
    props.$active ? props.theme.buttonPrimary : props.theme.surface};
  color: ${(props) =>
    props.$active ? props.theme.buttonPrimaryText : props.theme.textSecondary};
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;

  &:hover {
    background: ${(props) =>
      props.$active ? props.theme.buttonPrimary : props.theme.surfaceHover};
    opacity: ${(props) => (props.$active ? 0.9 : 1)};
  }

  ${(props) =>
    props.$overridden &&
    `
    &::after {
      content: "";
      position: absolute;
      top: 0.2rem;
      right: 0.2rem;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: ${props.theme.warning};
    }
  `}
`;

const Tooltip = styled.span`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.4rem 0.8rem;
  background: ${(props) => props.theme.surface};
  color: ${(props) => props.theme.textPrimary};
  font-size: 1.2rem;
  border-radius: 0.4rem;
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s, visibility 0.15s;
  pointer-events: none;
  z-index: 10;
  margin-bottom: 0.4rem;

  ${OptionButton}:hover & {
    opacity: 1;
    visibility: visible;
  }
`;

interface OptionConfig {
  key: keyof ResponseOptions;
  icon: typeof faComments;
  label: string;
}

const optionConfigs: OptionConfig[] = [
  { key: "chatMode", icon: faComments, label: "채팅" },
  { key: "aaMode", icon: faFont, label: "AA" },
  { key: "previewMode", icon: faEye, label: "미리보기" },
  { key: "noupMode", icon: faArrowUp, label: "Noup" },
  { key: "alwaysBottom", icon: faArrowDown, label: "하단 고정" },
];

interface ResponseOptionButtonsProps {
  options: ResponseOptions;
  onToggle: (key: keyof ResponseOptions) => void;
  isOverridden?: (key: keyof ResponseOptions) => boolean;
}

export function ResponseOptionButtons({
  options,
  onToggle,
  isOverridden,
}: ResponseOptionButtonsProps) {
  return (
    <Container>
      {optionConfigs.map((config) => (
        <OptionButton
          key={config.key}
          type="button"
          $active={options[config.key]}
          $overridden={isOverridden?.(config.key)}
          onClick={() => onToggle(config.key)}
          title={config.label}
        >
          <FontAwesomeIcon icon={config.icon} />
          <Tooltip>{config.label}</Tooltip>
        </OptionButton>
      ))}
    </Container>
  );
}
