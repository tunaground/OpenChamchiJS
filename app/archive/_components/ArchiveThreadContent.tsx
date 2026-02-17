"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import styled from "styled-components";
import { ArchiveResponseCard } from "./ArchiveResponseCard";
import { formatDate } from "../_lib/utils";
import { fetchArchiveThread } from "../_lib/api";
import type { ArchiveThread } from "../_lib/types";

const Container = styled.div`
  padding: 1.6rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.6rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1.6rem;
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  color: ${(props) => props.theme.textPrimary};
  font-size: 1.4rem;
  margin-bottom: 2.4rem;
  text-decoration: none;

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
    text-decoration: none;
  }
`;

const ThreadHeader = styled.header`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 2.4rem;
  margin-bottom: 2.4rem;
`;

const ThreadTitle = styled.h1`
  font-size: 2.4rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 1.6rem;
  word-break: break-all;
`;

const ThreadMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
`;

const MetaItem = styled.div`
  display: flex;
  gap: 0.8rem;
`;

const MetaLabel = styled.span`
  color: ${(props) => props.theme.textSecondary};
`;

const MetaValue = styled.span`
  color: ${(props) => props.theme.textPrimary};
`;

const ResponseList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.6rem;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 4.8rem;
  color: ${(props) => props.theme.textSecondary};
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 4.8rem;
  color: ${(props) => props.theme.textSecondary};
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
`;

interface ArchiveThreadContentProps {
  boardId: string;
  boardName: string;
  threadId: number;
  highlightSeqs: number[];
}

export function ArchiveThreadContent({
  boardId,
  boardName,
  threadId,
  highlightSeqs,
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

    fetchArchiveThread(boardId, threadId)
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
  }, [boardId, threadId]);

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
        <BackLink href={`/archive/${boardId}`}>
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
        <BackLink href={`/archive/${boardId}`}>
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
    <Container>
      <BackLink href={`/archive/${boardId}`}>
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
            />
          );
        })}
      </ResponseList>
    </Container>
  );
}
