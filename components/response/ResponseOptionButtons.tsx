"use client";

import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faComments,
  faFont,
  faEye,
  faArrowUp,
  faArrowDown,
  faRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { ResponseOptions } from "@/lib/store/responseOptions";
import { iconButtonCss } from "@/components/layout/iconButton";

const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 0.2rem;
`;

// Actions that are not options (e.g. refresh) sit apart on the right
const Trailing = styled.div`
  display: flex;
  gap: 0.4rem;
  margin-left: auto;
`;

const OptionButton = styled.button<{ $active: boolean; $overridden?: boolean }>`
  ${iconButtonCss}
  width: 3rem;
  height: 3rem;

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  /* The option is on in the global settings */
  ${(props) =>
    props.$overridden &&
    `
    &::after {
      content: "";
      position: absolute;
      top: 0.3rem;
      right: 0.3rem;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: ${props.theme.warning};
    }
  `}
`;

const Tooltip = styled.span`
  position: absolute;
  bottom: calc(100% + 0.4rem);
  left: 50%;
  transform: translateX(-50%);
  padding: 0.3rem 0.8rem;
  background: ${(props) => props.theme.paneRaised};
  color: ${(props) => props.theme.textPrimary};
  border: 1px solid ${(props) => props.theme.lineStrong};
  font-size: 1.2rem;
  border-radius: ${(props) => props.theme.radiusChip};
  white-space: nowrap;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.15s, visibility 0.15s;
  pointer-events: none;
  z-index: 10;

  ${OptionButton}:hover & {
    opacity: 1;
    visibility: visible;
  }
`;

const ResetButton = styled.button<{ $hasOverrides: boolean; $active?: boolean }>`
  ${iconButtonCss}
  width: 3rem;
  height: 3rem;
  color: ${(props) =>
    props.$hasOverrides ? props.theme.warning : props.theme.textSecondary};

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

const ResetTooltip = styled(Tooltip)`
  ${ResetButton}:hover & {
    opacity: 1;
    visibility: visible;
  }
`;

// Boolean option keys only (excludes quickSubmitKey which is a string type)
type BooleanOptionKey = Exclude<keyof ResponseOptions, "quickSubmitKey">;

interface OptionConfig {
  key: BooleanOptionKey;
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
  hasThreadOverride?: (key: keyof ResponseOptions) => boolean;
  onResetThreadOptions?: () => void;
  resetLabel?: string;
  realtimeEnabled?: boolean;
  trailing?: React.ReactNode;
}

export function ResponseOptionButtons({
  options,
  onToggle,
  isOverridden,
  hasThreadOverride,
  onResetThreadOptions,
  resetLabel = "초기화",
  realtimeEnabled = true,
  trailing,
}: ResponseOptionButtonsProps) {
  // Filter out chatMode if realtime is not enabled
  const visibleConfigs = realtimeEnabled
    ? optionConfigs
    : optionConfigs.filter((config) => config.key !== "chatMode");

  const hasAnyOverride = hasThreadOverride
    ? visibleConfigs.some((config) => hasThreadOverride(config.key))
    : false;

  return (
    <Container>
      {visibleConfigs.map((config) => (
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
      {onResetThreadOptions && (
        <ResetButton
          type="button"
          $hasOverrides={hasAnyOverride}
          onClick={onResetThreadOptions}
          disabled={!hasAnyOverride}
          title={resetLabel}
        >
          <FontAwesomeIcon icon={faRotateLeft} />
          <ResetTooltip>{resetLabel}</ResetTooltip>
        </ResetButton>
      )}
      {trailing && <Trailing>{trailing}</Trailing>}
    </Container>
  );
}
