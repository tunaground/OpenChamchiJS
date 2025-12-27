"use client";

import { formatDateTime } from "@/lib/utils/date-formatter";
import * as S from "./ResponseCard.styles";
import type { ResponseCardProps } from "./types";

export function ResponseCard({
  response,
  boardId,
  threadId,
  prerenderedContent,
  headerActions,
  attachmentRenderer,
  showRawContent = false,
  rawContent,
  variant = "main",
  onCopy,
}: ResponseCardProps) {
  const handleSeqClick = () => {
    navigator.clipboard.writeText(`${boardId}>${threadId}>${response.seq}`);
    onCopy?.();
  };

  return (
    <S.Card $variant={variant}>
      <S.Header>
        <S.Info>
          <S.Seq onClick={handleSeqClick}>#{response.seq}</S.Seq>
          <S.Username>{response.username}</S.Username>
          <S.AuthorId>({response.authorId})</S.AuthorId>
          <S.Date>{formatDateTime(response.createdAt)}</S.Date>
          {headerActions}
        </S.Info>
      </S.Header>

      {response.attachment && attachmentRenderer && (
        <S.Attachment>{attachmentRenderer(response.attachment)}</S.Attachment>
      )}

      <S.Content>
        {showRawContent && rawContent ? (
          <S.RawContentDisplay>{rawContent}</S.RawContentDisplay>
        ) : (
          prerenderedContent ?? response.content
        )}
      </S.Content>
    </S.Card>
  );
}
