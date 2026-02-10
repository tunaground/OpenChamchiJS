"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale } from "next-intl";
import styled from "styled-components";
import { Pagination } from "@/components/Pagination";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";
import { formatDateTime } from "@/lib/utils/date-formatter";

const Container = styled.div`
  padding: ${(props) => props.theme.containerPadding};
  max-width: ${(props) => props.theme.contentMaxWidth};
  margin: 0 auto;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: ${(props) => props.theme.containerPadding};
  }
`;

const BoardLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: ${(props) => props.theme.textSecondary};
  text-decoration: none;
  font-size: 1.4rem;
  margin-bottom: 1.6rem;

  &:hover {
    color: ${(props) => props.theme.textPrimary};
  }
`;

const ActionsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.6rem;
  margin-bottom: 1.6rem;
  flex-wrap: wrap;
`;

const PageTitle = styled.span`
  font-size: 1.6rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
`;

const SearchForm = styled.form`
  display: flex;
  gap: 0.8rem;
`;

const SearchInput = styled.input`
  flex: 1;
  max-width: 300px;
  padding: 0.8rem 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  background: ${(props) => props.theme.surface};
  color: ${(props) => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }

  &::placeholder {
    color: ${(props) => props.theme.textSecondary};
  }
`;

const SearchButton = styled.button`
  padding: 0.8rem 1.6rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: 4px;
  font-size: 1.4rem;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

const PinnedBadge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.8rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 500;
  margin-right: 0.8rem;
`;

const NoticeCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const NoticeCard = styled.div<{ $pinned?: boolean }>`
  background: ${(props) => props.$pinned ? props.theme.surfaceHover : props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 1.2rem;
`;

const CardTitle = styled.div`
  font-size: 1.4rem;
  font-weight: 500;
  margin-bottom: 0.6rem;

  a {
    color: ${(props) => props.theme.textPrimary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const CardMeta = styled.div`
  font-size: 1.2rem;
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

interface NoticeData {
  id: number;
  title: string;
  pinned: boolean;
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
      sidebar={sidebar}
      isLoggedIn={isLoggedIn}
      canAccessAdmin={canAccessAdmin}
      authLabels={authLabels}
    >
      <Container>
        <BoardLink href={`/index/${boardId}`}>&larr; {labels.goToBoard}</BoardLink>

        <ActionsBar>
          <PageTitle>{labels.title} : {boardName}</PageTitle>
          <SearchForm onSubmit={handleSearch}>
            <SearchInput
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels.searchPlaceholder}
            />
            <SearchButton type="submit">{labels.searchButton}</SearchButton>
          </SearchForm>
        </ActionsBar>

        {notices.length === 0 ? (
          <EmptyState>
            {initialSearch ? labels.noResults : labels.noNotices}
          </EmptyState>
        ) : (
          <>
            <NoticeCards>
              {notices.map((notice) => (
                <NoticeCard key={notice.id} $pinned={notice.pinned}>
                  <CardTitle>
                    {notice.pinned && <PinnedBadge>{labels.pinned}</PinnedBadge>}
                    <Link href={`/notice/${boardId}/${notice.id}`}>
                      {notice.title}
                    </Link>
                  </CardTitle>
                  <CardMeta>{formatDateTime(notice.createdAt, locale)}</CardMeta>
                </NoticeCard>
              ))}
            </NoticeCards>

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
