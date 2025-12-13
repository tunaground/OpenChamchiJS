"use client";

import { useMemo, useState, useEffect } from "react";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import bcrypt from "bcryptjs";
import { preparse, prerender, render } from "@/lib/tom";
import { DEFAULT_TRIPCODE_SALT } from "@/lib/utils/tripcode";
import { AnchorPreview, useAnchorStack } from "./AnchorPreview";
import { ResponseCard } from "./ResponseCard";

const PreviewWrapper = styled.div`
  margin-top: 1.6rem;
`;

const EmptyPreview = styled.div`
  color: ${(props) => props.theme.textSecondary};
  font-style: italic;
`;

export interface TomPreviewProps {
  /** Content to preview */
  content: string;
  /** Board ID for anchor resolution */
  boardId: string;
  /** Thread ID for anchor resolution (0 for content preview) */
  threadId?: number;
  /** Last seq number in the thread (for preview seq prediction) */
  lastSeq?: number;
  /** Variant: "content" for thread creation, "response" for response form */
  variant?: "content" | "response";
  /** AA mode - wrap content in [aa] tags */
  aaMode?: boolean;
  /** Username to display */
  username?: string;
  /** Default username if username is empty */
  defaultUsername?: string;
  /** Salt for tripcode calculation */
  tripcodeSalt?: string;
  /** Label to show when content is empty */
  emptyLabel?: string;
}

export function TomPreview({
  content,
  boardId,
  threadId = 0,
  lastSeq = 0,
  variant = "response",
  aaMode = false,
  username,
  defaultUsername,
  tripcodeSalt,
  emptyLabel = "미리보기",
}: TomPreviewProps) {
  const t = useTranslations();
  const [displayUsername, setDisplayUsername] = useState("");

  // Use the anchor stack hook
  const {
    anchorStack,
    handleAnchorClick,
    closeAnchorPreview,
    anchorPrerenderedContents,
  } = useAnchorStack();

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

  const sourceKey = variant === "content" ? "content-preview" : "preview";

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
        responseId: sourceKey,
        setAnchorInfo: handleAnchorClick,
        t,
      });
    } catch {
      return content;
    }
  }, [content, boardId, threadId, aaMode, handleAnchorClick, sourceKey, t]);

  // Real-time clock for preview
  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date().toISOString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Construct preview response data
  const previewResponse = useMemo(
    () => ({
      id: "preview",
      seq: lastSeq + 1,
      username: displayUsername || defaultUsername || "Anonymous",
      authorId: "PREVIEW",
      content: content,
      createdAt: now,
    }),
    [lastSeq, displayUsername, defaultUsername, content, now]
  );

  return (
    <PreviewWrapper>
      {/* AnchorPreview above the card, same as regular responses */}
      <AnchorPreview
        anchorStack={anchorStack}
        sourceKey={sourceKey}
        prerenderedContents={anchorPrerenderedContents}
        onAnchorClick={handleAnchorClick}
        onClose={closeAnchorPreview}
      />
      <ResponseCard
        response={previewResponse}
        boardId={boardId}
        threadId={threadId}
        prerenderedContent={rendered || <EmptyPreview>{emptyLabel}</EmptyPreview>}
        variant="main"
      />
    </PreviewWrapper>
  );
}
