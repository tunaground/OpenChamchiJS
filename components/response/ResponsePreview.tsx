"use client";

import { TomPreview } from "./TomPreview";

interface ResponsePreviewProps {
  content: string;
  boardId: string;
  threadId: number;
  lastSeq?: number;
  aaMode?: boolean;
  username?: string;
  defaultUsername?: string;
  tripcodeSalt?: string;
}

export function ResponsePreview({
  content,
  boardId,
  threadId,
  lastSeq,
  aaMode,
  username,
  defaultUsername,
  tripcodeSalt,
}: ResponsePreviewProps) {
  return (
    <TomPreview
      content={content}
      boardId={boardId}
      threadId={threadId}
      lastSeq={lastSeq}
      variant="response"
      aaMode={aaMode}
      username={username}
      defaultUsername={defaultUsername}
      tripcodeSalt={tripcodeSalt}
      emptyLabel="미리보기"
    />
  );
}
