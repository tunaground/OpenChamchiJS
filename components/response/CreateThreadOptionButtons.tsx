"use client";

import styled from "styled-components";
import { iconButtonCss } from "@/components/layout/iconButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFont, faEye } from "@fortawesome/free-solid-svg-icons";

const Container = styled.div`
  display: flex;
  gap: 0.2rem;
`;

const OptionButton = styled.button<{ $active: boolean }>`
  ${iconButtonCss}
  width: 3rem;
  height: 3rem;

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

const Tooltip = styled.span`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding: 0.4rem 0.8rem;
  background: ${(props) => props.theme.paneRaised};
  border: 1px solid ${(props) => props.theme.lineStrong};
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

export interface CreateThreadOptions {
  aaMode: boolean;
  previewMode: boolean;
}

interface CreateThreadOptionButtonsProps {
  options: CreateThreadOptions;
  onToggle: (key: keyof CreateThreadOptions) => void;
  labels: {
    aaMode: string;
    previewMode: string;
  };
}

export function CreateThreadOptionButtons({
  options,
  onToggle,
  labels,
}: CreateThreadOptionButtonsProps) {
  return (
    <Container>
      <OptionButton
        type="button"
        $active={options.aaMode}
        onClick={() => onToggle("aaMode")}
        title={labels.aaMode}
      >
        <FontAwesomeIcon icon={faFont} />
        <Tooltip>{labels.aaMode}</Tooltip>
      </OptionButton>
      <OptionButton
        type="button"
        $active={options.previewMode}
        onClick={() => onToggle("previewMode")}
        title={labels.previewMode}
      >
        <FontAwesomeIcon icon={faEye} />
        <Tooltip>{labels.previewMode}</Tooltip>
      </OptionButton>
    </Container>
  );
}
