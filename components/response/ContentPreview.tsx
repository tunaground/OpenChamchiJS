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
  font-size: 1.4rem;
  line-height: 1.6;
  word-break: break-word;
  white-space: pre-wrap;
`;

const EmptyPreview = styled.div`
  color: ${(props) => props.theme.textSecondary};
  font-style: italic;
`;

interface ContentPreviewProps {
  content: string;
  emptyLabel: string;
  boardId?: string;
}

export function ContentPreview({ content, emptyLabel, boardId = "" }: ContentPreviewProps) {
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
        threadId: 0,
        setAnchorInfo,
        t,
      });
    } catch {
      return content;
    }
  }, [content, boardId, t]);

  return (
    <PreviewContainer>
      {rendered || <EmptyPreview>{emptyLabel}</EmptyPreview>}
    </PreviewContainer>
  );
}
