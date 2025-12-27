"use client";

import { useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  margin-bottom: 0.8rem;
`;

const Thumbnail = styled.img<{ $expanded: boolean }>`
  max-width: ${(props) => (props.$expanded ? "100%" : "min(400px, 100%)")};
  max-height: ${(props) => (props.$expanded ? "none" : "400px")};
  cursor: pointer;
  border-radius: 4px;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  transition: max-width 0.2s ease, max-height 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
`;

interface ImageAttachmentProps {
  src: string;
  alt?: string;
}

export function ImageAttachment({ src, alt = "Attachment" }: ImageAttachmentProps) {
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    setExpanded(!expanded);
  };

  return (
    <Container>
      <Thumbnail
        src={src}
        alt={alt}
        $expanded={expanded}
        onClick={handleClick}
        loading="lazy"
      />
    </Container>
  );
}
