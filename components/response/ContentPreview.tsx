"use client";

import { TomPreview } from "./TomPreview";

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
  return (
    <TomPreview
      content={content}
      boardId={boardId}
      threadId={0}
      variant="content"
      username={username}
      defaultUsername={defaultUsername}
      tripcodeSalt={tripcodeSalt}
      emptyLabel={emptyLabel}
    />
  );
}
