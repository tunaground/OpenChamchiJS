"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import styled from "styled-components";
import { formatDate } from "../_lib/utils";
import type { ArchiveThreadIndex } from "../_lib/types";

const Container = styled.div`
  padding: 3.2rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.6rem;
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 2.4rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 1.2rem 1.6rem;
  font-size: 1.4rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  background: ${(props) => props.theme.surface};
  color: ${(props) => props.theme.textPrimary};
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: ${(props) => props.theme.primary};
  }

  &::placeholder {
    color: ${(props) => props.theme.textSecondary};
  }
`;

const ThreadList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const ThreadCard = styled.article`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 1.2rem;
  transition: background 0.15s ease;

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }
`;

const ThreadTitle = styled.h2`
  font-size: 1.4rem;
  font-weight: 500;
  margin-bottom: 0.8rem;
  word-break: break-all;

  a {
    color: ${(props) => props.theme.textPrimary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ThreadId = styled.span`
  color: ${(props) => props.theme.textSecondary};
  margin-right: 0.4rem;
`;

const ThreadSize = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-weight: 400;
`;

const ThreadMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
`;

const Pagination = styled.nav`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.4rem;
  margin-top: 2.4rem;
  flex-wrap: wrap;
`;

const PageButton = styled.button<{ $current?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.2rem;
  height: 3.2rem;
  padding: 0 0.8rem;
  font-size: 1.4rem;
  border-radius: 0.4rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  background: ${(props) =>
    props.$current ? props.theme.buttonPrimary : props.theme.surface};
  color: ${(props) =>
    props.$current ? props.theme.buttonPrimaryText : props.theme.textPrimary};
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.$current ? props.theme.buttonPrimary : props.theme.surfaceHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PageEllipsis = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.2rem;
  height: 3.2rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4.8rem;
  color: ${(props) => props.theme.textSecondary};
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
`;

const ResultCount = styled.div`
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 1.2rem;
`;

interface ArchiveBoardContentProps {
  boardId: string;
  threads: ArchiveThreadIndex[];
  initialPage: number;
  initialSearch: string;
  threadsPerPage: number;
}

export function ArchiveBoardContent({
  boardId,
  threads,
  initialPage,
  initialSearch,
  threadsPerPage,
}: ArchiveBoardContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Filter threads based on search
  const filteredThreads = useMemo(() => {
    if (!search.trim()) return threads;
    const query = search.toLowerCase();
    return threads.filter(
      (thread) =>
        thread.title.toLowerCase().includes(query) ||
        thread.username.toLowerCase().includes(query) ||
        String(thread.threadId).includes(query)
    );
  }, [threads, search]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredThreads.length / threadsPerPage);
  const startIndex = (currentPage - 1) * threadsPerPage;
  const pageThreads = filteredThreads.slice(
    startIndex,
    startIndex + threadsPerPage
  );

  // Update URL when search or page changes
  const updateUrl = useCallback(
    (newSearch: string, newPage: number) => {
      const params = new URLSearchParams();
      if (newSearch) params.set("search", newSearch);
      if (newPage > 1) params.set("page", String(newPage));
      const queryString = params.toString();
      router.replace(`${pathname}${queryString ? `?${queryString}` : ""}`, {
        scroll: false,
      });
    },
    [router, pathname]
  );

  // Debounced URL update for search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateUrl(search, currentPage);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, currentPage, updateUrl]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisible = 5;

    pages.push(1);

    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    if (currentPage <= 3) {
      end = Math.min(totalPages - 1, maxVisible - 1);
    } else if (currentPage >= totalPages - 2) {
      start = Math.max(2, totalPages - maxVisible + 2);
    }

    if (start > 2) pages.push("...");
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);

    return (
      <Pagination>
        {pages.map((p, i) => {
          if (p === "...") {
            return <PageEllipsis key={`ellipsis-${i}`}>...</PageEllipsis>;
          }
          return (
            <PageButton
              key={p}
              $current={p === currentPage}
              onClick={() => handlePageChange(p as number)}
            >
              {p}
            </PageButton>
          );
        })}
      </Pagination>
    );
  };

  return (
    <Container>
      <SearchContainer>
        <SearchInput
          type="text"
          placeholder="Search threads..."
          value={search}
          onChange={handleSearchChange}
        />
      </SearchContainer>

      {search && (
        <ResultCount>
          {filteredThreads.length} result{filteredThreads.length !== 1 ? "s" : ""} found
        </ResultCount>
      )}

      {pageThreads.length === 0 ? (
        <EmptyState>
          {search ? "No threads match your search." : "No threads found."}
        </EmptyState>
      ) : (
        <>
          <ThreadList>
            {pageThreads.map((thread) => (
              <ThreadCard key={thread.threadId}>
                <ThreadTitle>
                  <ThreadId>#{thread.threadId}</ThreadId>
                  <Link href={`/archive/${boardId}/${thread.threadId}`}>
                    {thread.title}
                  </Link>
                  <ThreadSize> ({thread.size})</ThreadSize>
                </ThreadTitle>
                <ThreadMeta>
                  <span dangerouslySetInnerHTML={{ __html: thread.username }} />
                </ThreadMeta>
                <ThreadMeta>
                  <span>
                    {formatDate(thread.createdAt)} - {formatDate(thread.updatedAt)}
                  </span>
                </ThreadMeta>
              </ThreadCard>
            ))}
          </ThreadList>
          {renderPagination()}
        </>
      )}
    </Container>
  );
}
