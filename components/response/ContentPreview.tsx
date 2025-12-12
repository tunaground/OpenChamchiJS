"use client";

import { useMemo, useState, useEffect } from "react";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import bcrypt from "bcryptjs";
import { preparse, prerender, render, AnchorInfo } from "@/lib/tom";
import { DEFAULT_TRIPCODE_SALT } from "@/lib/utils/tripcode";

const PreviewContainer = styled.div`
  margin-bottom: 0.8rem;
  background: ${(props) => props.theme.surfaceHover};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 0.4rem;
  overflow: hidden;
`;

const PreviewHeader = styled.div`
  padding: 0.8rem 1.2rem;
  background: ${(props) => props.theme.surface};
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

interface ContentPreviewProps {
  content: string;
  emptyLabel: string;
  boardId?: string;
  username?: string;
  defaultUsername?: string;
  tripcodeSalt?: string;
}

export function ContentPreview({
  content,
  emptyLabel,
  boardId = "",
  username,
  defaultUsername,
  tripcodeSalt,
}: ContentPreviewProps) {
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
      {displayUsername && <PreviewHeader>{displayUsername}</PreviewHeader>}
      <PreviewContent>
        {rendered || <EmptyPreview>{emptyLabel}</EmptyPreview>}
      </PreviewContent>
    </PreviewContainer>
  );
}
