"use client";

import { forwardRef, useMemo } from "react";
import Link from "next/link";
import styled from "styled-components";
import { extractYoutubeId, formatDate } from "../_lib/utils";
import { getAttachmentUrl } from "../_lib/api";
import type { ArchiveResponse } from "../_lib/types";

const Card = styled.article<{ $highlighted?: boolean }>`
  background: ${(props) =>
    props.$highlighted ? props.theme.surfaceHover : props.theme.responseCard};
  border: 1px solid
    ${(props) =>
      props.$highlighted ? props.theme.primary : props.theme.surfaceBorder};
  border-radius: 8px;
  overflow: hidden;
  scroll-margin-top: 7rem;
`;

const Header = styled.header<{ $highlighted?: boolean }>`
  padding: 1.2rem 1.6rem;
  background: ${(props) =>
    props.$highlighted ? "transparent" : props.theme.surfaceHover};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
  display: flex;
  align-items: center;
  gap: 1.2rem;
  flex-wrap: wrap;
`;

const ResponseSeq = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-weight: 500;

  a {
    color: ${(props) => props.theme.textSecondary};
    text-decoration: none;

    &:hover {
      color: ${(props) => props.theme.anchorALinkColor};
    }
  }
`;

const Username = styled.span`
  color: ${(props) => props.theme.textPrimary};
  font-weight: 500;
  word-break: break-all;
`;

const AuthorId = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-size: 1.2rem;
`;

const ResponseDate = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-size: 1.2rem;
  margin-left: auto;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    margin-left: 0;
    width: 100%;
    order: 10;
  }
`;

const Attachment = styled.div`
  padding: 1.6rem 1.6rem 0;
`;

const AttachmentImage = styled.img`
  max-width: 100%;
  max-height: 400px;
  border-radius: 4px;
  cursor: pointer;
`;

const AttachmentLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1.2rem;
  background: ${(props) => props.theme.surfaceHover};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  color: ${(props) => props.theme.textPrimary};
  font-size: 1.4rem;
  text-decoration: none;

  &:hover {
    background: ${(props) => props.theme.surface};
    text-decoration: none;
  }
`;

const YoutubeEmbed = styled.div`
  position: relative;
  width: 100%;
  max-width: 560px;
  padding-bottom: 56.25%;
  margin: 0;

  iframe {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 4px;
  }
`;

const Content = styled.div`
  padding: 1.6rem;
  font-size: 1.5rem;
  line-height: 1.6;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-word;

  a {
    color: ${(props) => props.theme.anchorALinkColor};
    text-decoration: underline;
    word-break: break-all;

    &:hover {
      text-decoration: none;
    }
  }

  hr {
    border: none;
    border-top: 1px solid ${(props) => props.theme.surfaceBorder};
    margin: 1.6rem 0;
  }

  .mona {
    display: block;
    white-space: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    font-family: "Saitamaar", sans-serif;
    color: black;
    width: 100%;
    background: rgba(255, 255, 255);
    line-height: 1.8rem;

    @media (max-width: ${(props) => props.theme.breakpoint}) {
      font-size: 1.2rem;
      line-height: 1.4rem;
    }
  }
`;

interface ArchiveResponseCardProps {
  boardId: string;
  threadId: number;
  response: ArchiveResponse;
  highlighted?: boolean;
}

export const ArchiveResponseCard = forwardRef<HTMLDivElement, ArchiveResponseCardProps>(
  function ArchiveResponseCard({ boardId, threadId, response, highlighted }, ref) {
    const hasAttachment = response.attachment && response.attachment.length > 0;
    const youtubeId = extractYoutubeId(response.youtube);
    const hasYoutube = !!youtubeId;
    const attachmentUrl = hasAttachment
      ? getAttachmentUrl(boardId, response.attachment)
      : null;
    const isImage =
      hasAttachment && /\.(jpg|jpeg|png|gif|webp)$/i.test(response.attachment);

    // Process content: linkify URLs and anchors
    const processedContent = useMemo(() => {
      return processContent(response.content, boardId, threadId);
    }, [response.content, boardId, threadId]);

    return (
      <Card ref={ref} $highlighted={highlighted} id={`response-${response.sequence}`}>
        <Header $highlighted={highlighted}>
          <ResponseSeq>
            <Link href={`/archive/${boardId}/${threadId}/${response.sequence}`}>
              #{response.sequence}
            </Link>
          </ResponseSeq>
          <Username dangerouslySetInnerHTML={{ __html: response.username }} />
          <AuthorId>({response.userId})</AuthorId>
          <ResponseDate>{formatDate(response.createdAt)}</ResponseDate>
        </Header>

        {hasAttachment && (
          <Attachment>
            {isImage ? (
              <a href={attachmentUrl!} target="_blank" rel="noopener noreferrer">
                <AttachmentImage
                  src={attachmentUrl!}
                  alt="Attachment"
                  loading="lazy"
                />
              </a>
            ) : (
              <AttachmentLink href={attachmentUrl!} target="_blank" rel="noopener noreferrer">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
                </svg>
                {response.attachment}
              </AttachmentLink>
            )}
          </Attachment>
        )}

        {hasYoutube && (
          <Attachment>
            <YoutubeEmbed>
              <iframe
                src={`https://www.youtube.com/embed/${youtubeId}`}
                allowFullScreen
                loading="lazy"
              />
            </YoutubeEmbed>
          </Attachment>
        )}

        <Content dangerouslySetInnerHTML={{ __html: processedContent }} />
      </Card>
    );
  }
);

/**
 * Process content: convert URLs and anchors to clickable links
 * Uses string manipulation instead of DOM APIs for SSR compatibility
 * Only processes text outside of HTML tags
 */
function processContent(html: string, boardId: string, threadId: number): string {
  // Split by HTML tags to only process text content
  const tagRegex = /(<[^>]+>)/g;
  const parts = html.split(tagRegex);

  const processed = parts.map((part) => {
    // Skip if it's an HTML tag
    if (part.startsWith("<")) {
      return part;
    }

    // Process text content
    let text = part;

    // Process URLs
    text = text.replace(
      /(https?:\/\/[^\s<>"{}|\\^`[\]]+)/g,
      (match) => `<a href="${match}" target="_blank" rel="noopener noreferrer">${match}</a>`
    );

    // Process anchors with HTML entity &gt; : board&gt;thread&gt;seq, &gt;thread&gt;seq, &gt;&gt;seq
    text = text.replace(
      /([a-z]*)&gt;(\d*)&gt;(\d+)(?:-(\d+))?/g,
      (match, anchorBoard, anchorThread, anchorStart, anchorEnd) => {
        const board = anchorBoard || boardId;
        const thread = anchorThread || String(threadId);
        const isSameThread = board === boardId && thread === String(threadId);

        let href: string;
        if (isSameThread && !anchorEnd) {
          // Same thread, single response - use hash link for in-page scroll
          href = `#response-${anchorStart}`;
        } else if (anchorEnd) {
          href = `/archive/${board}/${thread}/${anchorStart}-${anchorEnd}`;
        } else {
          href = `/archive/${board}/${thread}/${anchorStart}`;
        }

        return `<a href="${href}">${match}</a>`;
      }
    );

    // Also handle raw > anchors (in case not encoded)
    text = text.replace(
      /([a-z]*)>(\d*)>(\d+)(?:-(\d+))?/g,
      (match, anchorBoard, anchorThread, anchorStart, anchorEnd) => {
        const board = anchorBoard || boardId;
        const thread = anchorThread || String(threadId);
        const isSameThread = board === boardId && thread === String(threadId);

        let href: string;
        if (isSameThread && !anchorEnd) {
          // Same thread, single response - use hash link for in-page scroll
          href = `#response-${anchorStart}`;
        } else if (anchorEnd) {
          href = `/archive/${board}/${thread}/${anchorStart}-${anchorEnd}`;
        } else {
          href = `/archive/${board}/${thread}/${anchorStart}`;
        }

        return `<a href="${href}">${match}</a>`;
      }
    );

    return text;
  });

  return processed.join("");
}
