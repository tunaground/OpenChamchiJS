"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import styled from "styled-components";
import { ArchiveResponseCard } from "./ArchiveResponseCard";
import { formatDate } from "../_lib/utils";
import type { ArchiveThread } from "../_lib/types";

const Container = styled.div`
  padding: 3.2rem;

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

interface ArchiveThreadContentProps {
  boardId: string;
  boardName: string;
  thread: ArchiveThread;
  highlightSeqs: number[];
}

export function ArchiveThreadContent({
  boardId,
  boardName,
  thread,
  highlightSeqs,
}: ArchiveThreadContentProps) {
  const firstHighlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightSeqs.length > 0 && firstHighlightRef.current) {
      setTimeout(() => {
        firstHighlightRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [highlightSeqs]);

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
            <MetaValue>{formatDate(thread.createdAt)}</MetaValue>
          </MetaItem>
          <MetaItem>
            <MetaLabel>Updated:</MetaLabel>
            <MetaValue>{formatDate(thread.updatedAt)}</MetaValue>
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
