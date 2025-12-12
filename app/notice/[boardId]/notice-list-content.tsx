"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { Pagination } from "@/components/Pagination";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";

const Container = styled.div`
  padding: 3.2rem;
  max-width: 1000px;
  margin: 0 auto;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.6rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2.4rem;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 0.4rem;
`;

const BoardName = styled.span`
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
`;

const SearchForm = styled.form`
  display: flex;
  gap: 0.8rem;
  margin-bottom: 2.4rem;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 1.2rem;
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
  height: 3.5rem;
  padding: 0 1.6rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: 4px;
  font-size: 1.4rem;
  cursor: pointer;
  flex-shrink: 0;
  white-space: nowrap;

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
  const [search, setSearch] = useState(initialSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }
    router.push(`/notice/${boardId}?${params.toString()}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
        <Header>
          <Title>{labels.title}</Title>
          <BoardName>{boardName}</BoardName>
        </Header>

        <SearchForm onSubmit={handleSearch}>
          <SearchInput
            type="text"
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
            <NoticeCards>
              {notices.map((notice) => (
                <NoticeCard key={notice.id} $pinned={notice.pinned}>
                  <CardTitle>
                    {notice.pinned && <PinnedBadge>{labels.pinned}</PinnedBadge>}
                    <Link href={`/notice/${boardId}/${notice.id}`}>
                      {notice.title}
                    </Link>
                  </CardTitle>
                  <CardMeta>{formatDate(notice.createdAt)}</CardMeta>
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
