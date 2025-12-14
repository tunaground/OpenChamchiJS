"use client";

import { useTranslations } from "next-intl";
import { render } from "@/lib/tom";
import { ResponseCard } from "../ResponseCard";
import { ImageAttachment } from "../ImageAttachment";
import * as S from "./AnchorPreview.styles";
import type { AnchorPreviewProps } from "./types";

export function AnchorPreview({
  anchorStack,
  sourceKey,
  prerenderedContents,
  onAnchorClick,
  onClose,
  closeLabel,
  onCopy,
}: AnchorPreviewProps) {
  const t = useTranslations();

  // Find the stack item for this source key
  const stackItem = anchorStack.find((item) => item.info.sourceResponseId === sourceKey);
  if (!stackItem) return null;

  const { info, responses: anchorResponses, loading } = stackItem;

  return (
    <S.Section>
      <S.Header>
        <S.Title>
          &gt;{info.threadId}&gt;{info.start}
          {info.end && info.end !== info.start && `-${info.end}`}
        </S.Title>
        <S.CloseButton onClick={() => onClose(sourceKey)}>
          {closeLabel ?? "✕"}
        </S.CloseButton>
      </S.Header>

      {loading ? (
        <S.Loading>Loading...</S.Loading>
      ) : anchorResponses.filter((r) => r.seq !== 0).length === 0 ? (
        <S.Loading>{t("response.not_found")}</S.Loading>
      ) : (
        anchorResponses
          .filter((r) => r.seq !== 0)
          .map((anchorResponse) => {
            const nestedKey = `anchor:${sourceKey}:${anchorResponse.id}`;
            const prerendered = prerenderedContents.get(anchorResponse.id);

            return (
              <div key={anchorResponse.id}>
                {/* Recursively render nested anchor previews */}
                <AnchorPreview
                  anchorStack={anchorStack}
                  sourceKey={nestedKey}
                  prerenderedContents={prerenderedContents}
                  onAnchorClick={onAnchorClick}
                  onClose={onClose}
                  closeLabel={closeLabel}
                  onCopy={onCopy}
                />
                <ResponseCard
                  response={anchorResponse}
                  boardId={info.boardId}
                  threadId={info.threadId}
                  variant="anchor"
                  attachmentRenderer={(src) => <ImageAttachment src={src} />}
                  prerenderedContent={
                    prerendered
                      ? render(prerendered, {
                          boardId: info.boardId,
                          threadId: info.threadId,
                          responseId: nestedKey,
                          setAnchorInfo: onAnchorClick,
                          t,
                          onCopy,
                        })
                      : undefined
                  }
                />
              </div>
            );
          })
      )}
    </S.Section>
  );
}
