"use client";

import Link from "next/link";
import styled from "styled-components";

const PaginationWrapper = styled.nav`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.2rem;
  margin-top: 2rem;
`;

const PageLink = styled(Link)<{ $active?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.2rem;
  height: 3.2rem;
  padding: 0 0.8rem;
  font-size: 1.4rem;
  text-decoration: none;
  border-radius: ${(props) => props.theme.radiusControl};
  background: ${(props) => (props.$active ? props.theme.accentSoft : "transparent")};
  color: ${(props) => (props.$active ? props.theme.accent : props.theme.textSecondary)};
  font-weight: ${(props) => (props.$active ? 600 : 400)};

  &:hover {
    background: ${(props) => (props.$active ? props.theme.accentSoft : props.theme.hover)};
    color: ${(props) => (props.$active ? props.theme.accent : props.theme.textPrimary)};
  }
`;

const PageSpan = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.4rem;
  height: 3.2rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textMuted};
`;

const DisabledLink = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.2rem;
  height: 3.2rem;
  padding: 0 0.8rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textMuted};
  opacity: 0.5;
  cursor: not-allowed;
`;

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  maxVisiblePages?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  maxVisiblePages = 5,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const getPageUrl = (page: number) => {
    const url = new URL(baseUrl, "http://localhost");
    url.searchParams.set("page", String(page));
    return `${url.pathname}${url.search}`;
  };

  const getVisiblePages = () => {
    const pages: (number | "ellipsis")[] = [];
    const halfVisible = Math.floor(maxVisiblePages / 2);

    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, currentPage + halfVisible);

    if (currentPage <= halfVisible) {
      endPage = Math.min(totalPages, maxVisiblePages);
    } else if (currentPage > totalPages - halfVisible) {
      startPage = Math.max(1, totalPages - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      pages.push(1);
      if (startPage > 2) {
        pages.push("ellipsis");
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pages.push("ellipsis");
      }
      pages.push(totalPages);
    }

    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <PaginationWrapper>
      {currentPage > 1 ? (
        <PageLink prefetch={false} href={getPageUrl(currentPage - 1)}>&laquo;</PageLink>
      ) : (
        <DisabledLink>&laquo;</DisabledLink>
      )}

      {visiblePages.map((page, index) =>
        page === "ellipsis" ? (
          <PageSpan key={`ellipsis-${index}`}>...</PageSpan>
        ) : (
          <PageLink
            key={page}
            prefetch={false}
            href={getPageUrl(page)}
            $active={page === currentPage}
          >
            {page}
          </PageLink>
        )
      )}

      {currentPage < totalPages ? (
        <PageLink prefetch={false} href={getPageUrl(currentPage + 1)}>&raquo;</PageLink>
      ) : (
        <DisabledLink>&raquo;</DisabledLink>
      )}
    </PaginationWrapper>
  );
}
