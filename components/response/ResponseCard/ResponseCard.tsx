"use client";

import { memo } from "react";
import { useLocale } from "next-intl";
import { formatDateTime } from "@/lib/utils/date-formatter";
import { copyText } from "@/lib/utils/clipboard";
import * as S from "./ResponseCard.styles";
import type { ResponseCardProps } from "./types";

export const ResponseCard = memo(function ResponseCard({
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
  onUsernameClick,
  onAuthorIdClick,
}: ResponseCardProps) {
  const locale = useLocale();
  const isOp = response.seq === 0;

  const handleSeqClick = async () => {
    if (await copyText(`${boardId}>${threadId}>${response.seq}`)) onCopy?.();
  };

  return (
    <S.Card $variant={variant} id={variant === "main" ? `response-${response.seq}` : undefined}>
      {variant === "main" && (
        <S.Gutter type="button" $op={isOp} onClick={handleSeqClick} title={`>>${response.seq}`}>
          {response.seq}
        </S.Gutter>
      )}
      <S.Main>
        <S.Header>
          <S.Seq
            type="button"
            $inline={variant === "anchor" ? "always" : "mobile"}
            $op={isOp}
            onClick={handleSeqClick}
          >
            #{response.seq}
          </S.Seq>
          <S.Username
            type="button"
            $clickable={!!onUsernameClick}
            onClick={onUsernameClick ? () => onUsernameClick(response.username) : undefined}
            tabIndex={onUsernameClick ? 0 : -1}
          >
            {response.username}
          </S.Username>
          <S.AuthorId
            type="button"
            $clickable={!!onAuthorIdClick}
            onClick={onAuthorIdClick ? () => onAuthorIdClick(response.authorId) : undefined}
            tabIndex={onAuthorIdClick ? 0 : -1}
          >
            {response.authorId}
          </S.AuthorId>
          <S.Date dateTime={response.createdAt}>{formatDateTime(response.createdAt, locale)}</S.Date>
          {headerActions && <S.Actions>{headerActions}</S.Actions>}
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
      </S.Main>
    </S.Card>
  );
});
