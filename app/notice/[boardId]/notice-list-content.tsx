"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import styled from "styled-components";
import { Pagination } from "@/components/Pagination";
import { PageLayout } from "@/components/layout";
import { PageContainer } from "@/components/layout/PageContainer";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";
import { formatDateTime } from "@/lib/utils/date-formatter";

const Container = PageContainer;

const SearchForm = styled.form`
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1.6rem;
`;

const SearchInput = styled.input`
  flex: 1;
  max-width: 32rem;
  height: 3.4rem;
  padding: 0 1rem;
  border: 1px solid ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusControl};
  font-size: 1.4rem;
  background: ${(props) => props.theme.paneSunken};
  color: ${(props) => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.accent};
  }

  &::placeholder {
    color: ${(props) => props.theme.textMuted};
  }
`;

const SearchButton = styled.button`
  height: 3.4rem;
  padding: 0 1.4rem;
  border: 1px solid ${(props) => props.theme.lineStrong};
  border-radius: ${(props) => props.theme.radiusControl};
  background: transparent;
  color: ${(props) => props.theme.textPrimary};
  font-size: 1.4rem;
  cursor: pointer;

  &:hover {
    background: ${(props) => props.theme.hover};
  }
`;

const Chip = styled.span<{ $tone?: "accent" }>`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  height: 2rem;
  padding: 0 0.6rem;
  border-radius: ${(props) => props.theme.radiusChip};
  font-size: 1.2rem;
  font-weight: 500;
  background: ${(props) => (props.$tone === "accent" ? props.theme.accentSoft : props.theme.paneSunken)};
  color: ${(props) => (props.$tone === "accent" ? props.theme.accent : props.theme.textSecondary)};
  border: 1px solid ${(props) => (props.$tone === "accent" ? "transparent" : props.theme.line)};
`;

const NoticeRows = styled.ul`
  list-style: none;
  border-top: 1px solid ${(props) => props.theme.line};
`;

const NoticeRow = styled.li<{ $pinned?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 1.1rem 1.2rem;
  border-bottom: 1px solid ${(props) => props.theme.line};
  background: ${(props) => (props.$pinned ? props.theme.accentSoft : "transparent")};

  a {
    flex: 1;
    min-width: 0;
    font-weight: 500;
    color: ${(props) => props.theme.textPrimary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover {
      color: ${(props) => props.theme.accent};
    }
  }

  time {
    flex-shrink: 0;
    font-size: 1.3rem;
    color: ${(props) => props.theme.textMuted};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4.8rem 0;
  color: ${(props) => props.theme.textSecondary};
`;

interface NoticeData {
  id: number;
  title: string;
  pinned: boolean;
  isGlobal: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Labels {
  title: string;
  searchPlaceholder: string;
  searchButton: string;
  noNotices: string;
  noResults: string;
  noticeTitle: string;
  pinned: string;
  createdAt: string;
  goToBoard: string;
  globalNotice: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BoardData {
  id: string;
  name: string;
}

interface AuthLabels {
  login: string;
  logout: string;
}

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

interface NoticeListContentProps {
  boardId: string;
  boardName: string;
  boards: BoardData[];
  customLinks?: CustomLink[];
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: AuthLabels;
  notices: NoticeData[];
  pagination: PaginationData;
  search: string;
  labels: Labels;
  boardsTitle: string;
  manualLabel: string;
}

export function NoticeListContent({
  boardId,
  boardName,
  boards,
  customLinks,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  notices,
  pagination,
  search: initialSearch,
  labels,
  boardsTitle,
  manualLabel,
}: NoticeListContentProps) {
  const router = useRouter();
  const locale = useLocale();
  const [search, setSearch] = useState(initialSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }
    router.push(`/notice/${boardId}?${params.toString()}`);
  };

  const getBaseUrl = () => {
    const params = new URLSearchParams();
    if (initialSearch) {
      params.set("search", initialSearch);
    }
    const queryString = params.toString();
    return `/notice/${boardId}${queryString ? `?${queryString}` : ""}`;
  };

  const sidebar = <BoardListSidebar boards={boards} customLinks={customLinks} title={boardsTitle} manualLabel={manualLabel} />;

  return (
    <PageLayout
      title={labels.title}
      parent={{ label: boardName, href: `/index/${boardId}` }}
      sidebar={sidebar}
      isLoggedIn={isLoggedIn}
      canAccessAdmin={canAccessAdmin}
      authLabels={authLabels}
    >
      <Container>
        <SearchForm onSubmit={handleSearch} role="search">
          <SearchInput
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={labels.searchPlaceholder}
          />
          <SearchButton type="submit">{labels.searchButton}</SearchButton>
        </SearchForm>

        {notices.length === 0 ? (
          <EmptyState>
            {initialSearch ? labels.noResults : labels.noNotices}
          </EmptyState>
        ) : (
          <>
            <NoticeRows>
              {notices.map((notice) => (
                <NoticeRow key={notice.id} $pinned={notice.pinned}>
                  {notice.pinned && <Chip $tone="accent">{labels.pinned}</Chip>}
                  {notice.isGlobal && <Chip>{labels.globalNotice}</Chip>}
                  <Link prefetch={false} href={`/notice/${boardId}/${notice.id}`}>
                    {notice.title}
                  </Link>
                  <time dateTime={notice.createdAt}>{formatDateTime(notice.createdAt, locale)}</time>
                </NoticeRow>
              ))}
            </NoticeRows>

            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              baseUrl={getBaseUrl()}
            />
          </>
        )}
      </Container>
    </PageLayout>
  );
}
