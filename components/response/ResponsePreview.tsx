"use client";

import { useMemo, useState } from "react";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import { preparse, prerender, render, AnchorInfo } from "@/lib/tom";

const PreviewContainer = styled.div`
  padding: 1.2rem;
  margin-bottom: 0.8rem;
  background: ${(props) => props.theme.surfaceHover};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 0.4rem;
  min-height: 4rem;
  max-height: 20rem;
  overflow-y: auto;
  font-size: 1.4rem;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
`;

const EmptyPreview = styled.div`
  color: ${(props) => props.theme.textSecondary};
  font-style: italic;
`;

interface ResponsePreviewProps {
  content: string;
  boardId: string;
  threadId: number;
}

export function ResponsePreview({
  content,
  boardId,
  threadId,
}: ResponsePreviewProps) {
  const t = useTranslations();
  const [, setAnchorInfo] = useState<AnchorInfo | null>(null);

  const rendered = useMemo(() => {
    if (!content.trim()) {
      return null;
    }

    try {
      const preparsed = preparse(content);
      const prerendered = prerender(preparsed);
      return render(prerendered, {
        boardId,
        threadId,
        setAnchorInfo,
        t,
      });
    } catch {
      return content;
    }
  }, [content, boardId, threadId, t]);

  return (
    <PreviewContainer>
      {rendered || <EmptyPreview>미리보기</EmptyPreview>}
    </PreviewContainer>
  );
}
