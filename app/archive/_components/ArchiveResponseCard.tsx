"use client";

import { forwardRef, useMemo } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import styled, { css } from "styled-components";
import { extractYoutubeId, formatDate } from "../_lib/utils";
import { getAttachmentUrl } from "../_lib/api";
import type { ArchiveResponse } from "../_lib/types";

/*
 * Same ledger look as the live thread (components/response/ResponseCard):
 * the seq number sits large in a left gutter, rows split by hairlines.
 */

const Card = styled.article<{ $highlighted?: boolean }>`
  display: grid;
  grid-template-columns: ${(props) => props.theme.ledgerGutter} minmax(0, 1fr);
  padding: 1.4rem 0 1.6rem;
  border-bottom: 1px solid ${(props) => props.theme.line};
  scroll-margin-top: 7rem;

  ${(props) =>
    props.$highlighted &&
    css`
      margin: 0 -1.2rem;
      padding-left: 1.2rem;
      padding-right: 1.2rem;
      background: ${props.theme.accentSoft};
      border-radius: ${props.theme.radiusControl};
    `}

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    grid-template-columns: minmax(0, 1fr);
    padding-top: 1.2rem;
    padding-bottom: 1.2rem;
  }
`;

const Gutter = styled(Link)<{ $op?: boolean }>`
  /* Sit on the same baseline as the name line, not flush with its top */
  align-self: baseline;
  padding: 0 1.2rem 0 0;
  font-size: 2rem;
  font-weight: ${(props) => (props.$op ? 500 : 300)};
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-align: right;
  color: ${(props) => (props.$op ? props.theme.accent : props.theme.textMuted)};
  transition: color 0.15s;

  &:hover {
    color: ${(props) => props.theme.accent};
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

const Main = styled.div`
  align-self: baseline;
  min-width: 0;
`;

const Header = styled.header`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.2rem 1rem;
  font-size: 1.4rem;
`;

/** Inline seq, shown on mobile where the gutter hides */
const ResponseSeq = styled(Link)<{ $op?: boolean }>`
  display: none;
  font-weight: 600;
  color: ${(props) => (props.$op ? props.theme.accent : props.theme.textSecondary)};

  &:hover {
    color: ${(props) => props.theme.accent};
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: inline;
  }
`;

const Username = styled.span`
  color: ${(props) => props.theme.textPrimary};
  font-weight: 600;
  word-break: break-all;
`;

const AuthorId = styled.span`
  color: ${(props) => props.theme.textMuted};
  font-size: 1.3rem;
`;

const ResponseDate = styled.span`
  color: ${(props) => props.theme.textMuted};
  font-size: 1.3rem;

  /* Mobile: always on its own second line */
  @media (max-width: ${(props) => props.theme.breakpoint}) {
    flex-basis: 100%;
    order: 1;
  }
`;

const Attachment = styled.div`
  margin-top: 0.8rem;
`;

const AttachmentImage = styled.img`
  max-width: 100%;
  max-height: 400px;
  border-radius: ${(props) => props.theme.radiusControl};
  cursor: pointer;
`;

const AttachmentLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.6rem 1rem;
  background: ${(props) => props.theme.paneSunken};
  border: 1px solid ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusControl};
  color: ${(props) => props.theme.textPrimary};
  font-size: 1.4rem;
  text-decoration: none;

  &:hover {
    background: ${(props) => props.theme.hover};
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
    border-radius: ${(props) => props.theme.radiusControl};
  }
`;

const Content = styled.div`
  margin-top: 0.6rem;
  font-size: 1.5rem;
  line-height: 1.75;
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
    border-top: 1px solid ${(props) => props.theme.line};
    margin: 1.6rem 0;
  }

  .mona {
    display: block;
    white-space: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    font-family: ${(props) => props.theme.fontAA};
    /* AA always draws on paper so coloured art keeps its look in dark mode */
    color: black;
    width: 100%;
    background: white;
    line-height: 1.8rem;
    padding: 0.8rem 1rem;
    border: 1px solid ${(props) => props.theme.line};
    border-radius: ${(props) => props.theme.radiusControl};

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
  baseUrl: string;
}

export const ArchiveResponseCard = forwardRef<HTMLDivElement, ArchiveResponseCardProps>(
  function ArchiveResponseCard({ boardId, threadId, response, highlighted, baseUrl }, ref) {
    const locale = useLocale();
    const hasAttachment = response.attachment && response.attachment.length > 0;
    const youtubeId = extractYoutubeId(response.youtube);
    const hasYoutube = !!youtubeId;
    const attachmentUrl = hasAttachment
      ? getAttachmentUrl(baseUrl, boardId, response.attachment)
      : null;
    const seqHref = `/archive/${boardId}/${threadId}/${response.sequence}`;
    const isOp = response.sequence === 0;
    const isImage =
      hasAttachment && /\.(jpg|jpeg|png|gif|webp)$/i.test(response.attachment);

    // Process content: linkify URLs and anchors
    const processedContent = useMemo(() => {
      return processContent(response.content, boardId, threadId);
    }, [response.content, boardId, threadId]);

    return (
      <Card ref={ref} $highlighted={highlighted} id={`response-${response.sequence}`}>
        <Gutter prefetch={false} href={seqHref} $op={isOp} aria-hidden tabIndex={-1}>
          {response.sequence}
        </Gutter>
        <Main>
          <Header>
            <ResponseSeq prefetch={false} href={seqHref} $op={isOp}>
              #{response.sequence}
            </ResponseSeq>
            <Username dangerouslySetInnerHTML={{ __html: response.username }} />
            <AuthorId>({response.userId})</AuthorId>
            <ResponseDate>{formatDate(response.createdAt, locale)}</ResponseDate>
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
        </Main>
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
