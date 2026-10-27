"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import styled from "styled-components";
import { ArchiveResponseCard } from "./ArchiveResponseCard";
import { formatDate } from "../_lib/utils";
import { fetchArchiveThread } from "../_lib/api";
import type { ArchiveThread } from "../_lib/types";
import { ledgerGutterStyle } from "@/components/response";

/* Same as the live thread page: full width, minimal side padding for AA */
const Container = styled.div`
  width: 100%;
  padding: 1.6rem ${(props) => props.theme.ledgerPadding} 3.2rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.2rem 1rem 2.4rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 1.2rem;
  font-size: 1.3rem;
  color: ${(props) => props.theme.textSecondary};

  &:hover {
    color: ${(props) => props.theme.accent};
  }

  svg {
    width: 1.4rem;
    height: 1.4rem;
  }
`;

/* Same opener as the live thread (components/thread/ThreadChrome) */
const ThreadHeader = styled.header`
  padding: 0.6rem 0 1.6rem;
`;

const Chips = styled.div`
  display: flex;
  gap: 0.6rem;
  margin-bottom: 0.8rem;
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  height: 2rem;
  padding: 0 0.6rem;
  border-radius: ${(props) => props.theme.radiusChip};
  font-size: 1.2rem;
  font-weight: 500;
  background: ${(props) => props.theme.paneSunken};
  color: ${(props) => props.theme.textSecondary};
  border: 1px solid ${(props) => props.theme.line};
`;

const ThreadTitle = styled.h1`
  font-size: 2.6rem;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-all;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    font-size: 2.2rem;
  }
`;

const ThreadMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.6rem;
  margin-top: 0.8rem;
  font-size: 1.3rem;
  color: ${(props) => props.theme.textMuted};
`;

const MetaItem = styled.span`
  display: inline-flex;
  gap: 0.4rem;
`;

const MetaLabel = styled.span``;

const MetaValue = styled.b`
  color: ${(props) => props.theme.textSecondary};
  font-weight: 500;
`;

const ResponseList = styled.div`
  border-top: 1px solid ${(props) => props.theme.line};
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 4.8rem;
  color: ${(props) => props.theme.textSecondary};
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 4.8rem 1.6rem;
  color: ${(props) => props.theme.textSecondary};
  border: 1px dashed ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusControl};
`;

interface ArchiveThreadContentProps {
  boardId: string;
  boardName: string;
  threadId: number;
  highlightSeqs: number[];
  baseUrl: string;
}

export function ArchiveThreadContent({
  boardId,
  boardName,
  threadId,
  highlightSeqs,
  baseUrl,
}: ArchiveThreadContentProps) {
  const locale = useLocale();
  const firstHighlightRef = useRef<HTMLDivElement>(null);
  const [thread, setThread] = useState<ArchiveThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(false);

    fetchArchiveThread(baseUrl, boardId, threadId)
      .then((data) => {
        if (cancelled) return;
        setThread(data);
      })
      .catch(() => {
        if (cancelled) return;
        setError(true);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [baseUrl, boardId, threadId]);

  useEffect(() => {
    if (highlightSeqs.length > 0 && firstHighlightRef.current) {
      setTimeout(() => {
        firstHighlightRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [highlightSeqs, thread]);

  if (loading) {
    return (
      <Container>
        <BackLink prefetch={false} href={`/archive/${boardId}`}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to {boardName}
        </BackLink>
        <LoadingState>Loading...</LoadingState>
      </Container>
    );
  }

  if (error || !thread) {
    return (
      <Container>
        <BackLink prefetch={false} href={`/archive/${boardId}`}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to {boardName}
        </BackLink>
        <ErrorState>Failed to load thread.</ErrorState>
      </Container>
    );
  }

  return (
    <Container style={ledgerGutterStyle(thread.size)}>
      <BackLink prefetch={false} href={`/archive/${boardId}`}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to {boardName}
      </BackLink>

      <ThreadHeader>
        <Chips>
          <Chip>#{thread.threadId}</Chip>
        </Chips>
        <ThreadTitle>{thread.title}</ThreadTitle>
        <ThreadMeta>
          <MetaItem>
            <MetaLabel>Author:</MetaLabel>
            <MetaValue dangerouslySetInnerHTML={{ __html: thread.username }} />
          </MetaItem>
          <MetaItem>
            <MetaLabel>Responses:</MetaLabel>
            <MetaValue>{thread.size}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>Created:</MetaLabel>
            <MetaValue>{formatDate(thread.createdAt, locale)}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>Updated:</MetaLabel>
            <MetaValue>{formatDate(thread.updatedAt, locale)}</MetaValue>
          </MetaItem>
        </ThreadMeta>
      </ThreadHeader>

      <ResponseList>
        {thread.responses.map((response) => {
          const isHighlighted = highlightSeqs.includes(response.sequence);
          const isFirstHighlight =
            isHighlighted && response.sequence === highlightSeqs[0];

          return (
            <ArchiveResponseCard
              key={response.sequence}
              ref={isFirstHighlight ? firstHighlightRef : undefined}
              boardId={boardId}
              threadId={thread.threadId}
              response={response}
              highlighted={isHighlighted}
              baseUrl={baseUrl}
            />
          );
        })}
      </ResponseList>
    </Container>
  );
}
