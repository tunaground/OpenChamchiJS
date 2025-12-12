"use client";

import { useMemo, useState, useEffect } from "react";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import bcrypt from "bcryptjs";
import { preparse, prerender, render, AnchorInfo } from "@/lib/tom";
import { DEFAULT_TRIPCODE_SALT } from "@/lib/utils/tripcode";

const PreviewContainer = styled.div`
  margin-bottom: 0.8rem;
  background: ${(props) => props.theme.responseCard};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 0.4rem;
  overflow: hidden;
`;

const PreviewHeader = styled.div`
  padding: 0.8rem 1.2rem;
  background: ${(props) => props.theme.surfaceHover};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
  font-size: 1.4rem;
  color: ${(props) => props.theme.textPrimary};
  font-weight: 500;
`;

const PreviewContent = styled.div`
  padding: 1.2rem;
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

interface ResponsePreviewProps {
  content: string;
  boardId: string;
  threadId: number;
  aaMode?: boolean;
  username?: string;
  defaultUsername?: string;
  tripcodeSalt?: string;
}

export function ResponsePreview({
  content,
  boardId,
  threadId,
  aaMode,
  username,
  defaultUsername,
  tripcodeSalt,
}: ResponsePreviewProps) {
  const t = useTranslations();
  const [, setAnchorInfo] = useState<AnchorInfo | null>(null);
  const [displayUsername, setDisplayUsername] = useState("");

  const rawUsername = username?.trim() || defaultUsername || "";

  // Calculate tripcode asynchronously
  useEffect(() => {
    async function calculateTripcode() {
      // Replace ◆ with <> to prevent spoofing (same as server)
      let name = rawUsername.replace(/◆/g, "<>");

      const parts = name.split("#");
      if (parts.length >= 2) {
        const displayName = parts[0];
        const secret = parts.slice(1).join("#");
        const salt = tripcodeSalt || DEFAULT_TRIPCODE_SALT;
        const hash = await bcrypt.hash(secret, salt);
        const tripcode = hash.substring(hash.length - 10);
        setDisplayUsername(`${displayName}◆${tripcode}`);
      } else {
        setDisplayUsername(name);
      }
    }

    calculateTripcode();
  }, [rawUsername, tripcodeSalt]);

  const rendered = useMemo(() => {
    if (!content.trim()) {
      return null;
    }

    try {
      // Apply AA mode: wrap content with [aa][/aa] tags
      const processedContent = aaMode ? `[aa]${content}[/aa]` : content;
      const preparsed = preparse(processedContent);
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
  }, [content, boardId, threadId, aaMode, t]);

  return (
    <PreviewContainer>
      {displayUsername && <PreviewHeader>{displayUsername}</PreviewHeader>}
      <PreviewContent>
        {rendered || <EmptyPreview>미리보기</EmptyPreview>}
      </PreviewContent>
    </PreviewContainer>
  );
}
