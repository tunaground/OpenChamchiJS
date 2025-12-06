"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Pagination } from "@/components/Pagination";
import { PageLayout, AdminButton, AuthButton, ThemeToggleButton } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";

const Container = styled.div`
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
`;

const NoticesSection = styled.section`
  margin-bottom: 1.5rem;
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  overflow: hidden;
`;

const NoticesHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: ${(props) => props.theme.surfaceHover};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const NoticesTitle = styled.h2`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin: 0;
`;

const MoreLink = styled(Link)`
  font-size: 0.75rem;
  color: ${(props) => props.theme.textSecondary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const NoticeList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NoticeItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
  font-size: 0.875rem;

  &:last-child {
    border-bottom: none;
  }

  a {
    color: ${(props) => props.theme.textPrimary};
    text-decoration: none;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const PinnedBadge = styled.span`
  display: inline-block;
  padding: 0.125rem 0.375rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 500;
  flex-shrink: 0;
`;

const NoticeDate = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-size: 0.75rem;
  flex-shrink: 0;
`;

const ActionsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const CreateButton = styled(Link)`
  display: inline-block;
  padding: 0.5rem 1rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border-radius: 4px;
  font-size: 0.875rem;
  text-decoration: none;

  &:hover {
    opacity: 0.9;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  overflow: hidden;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem 1rem;
  background: ${(props) => props.theme.surfaceHover};
  font-weight: 500;
  font-size: 0.875rem;
  color: ${(props) => props.theme.textSecondary};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const Td = styled.td`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: ${(props) => props.theme.textPrimary};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const TitleCell = styled(Td)`
  a {
    color: ${(props) => props.theme.textPrimary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const TopRow = styled.tr`
  background: ${(props) => props.theme.surfaceHover};
`;

const Badge = styled.span<{ $variant?: "top" | "ended" }>`
  display: inline-block;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-size: 0.625rem;
  font-weight: 500;
  margin-right: 0.5rem;
  background: ${(props) =>
    props.$variant === "ended"
      ? props.theme.textSecondary + "30"
      : props.theme.textPrimary};
  color: ${(props) =>
    props.$variant === "ended"
      ? props.theme.textSecondary
      : props.theme.background};
`;

const DateCell = styled(Td)`
  white-space: nowrap;
  color: ${(props) => props.theme.textSecondary};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${(props) => props.theme.textSecondary};
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 0.5rem;
`;

const SearchInput = styled.input`
  flex: 1;
  max-width: 300px;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 0.875rem;
  background: ${(props) => props.theme.background};
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
  padding: 0.5rem 1rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
`;

interface ThreadData {
  id: number;
  title: string;
  username: string;
  ended: boolean;
  top: boolean;
  responseCount: number;
  createdAt: string;
  updatedAt: string;
}

interface NoticeData {
  id: number;
  title: string;
  pinned: boolean;
  createdAt: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Labels {
  notices: string;
  moreNotices: string;
  createThread: string;
  id: string;
  threadTitle: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  noThreads: string;
  noResults: string;
  pinned: string;
  ended: string;
  top: string;
  searchPlaceholder: string;
  searchButton: string;
}

interface BoardData {
  id: string;
  name: string;
}

interface AuthLabels {
  login: string;
  logout: string;
}

interface BoardIndexContentProps {
  boardId: string;
  boardName: string;
  boards: BoardData[];
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: AuthLabels;
  threads: ThreadData[];
  pagination: PaginationData;
  search: string;
  notices: NoticeData[];
  labels: Labels;
}

export function BoardIndexContent({
  boardId,
  boardName,
  boards,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  threads,
  pagination,
  search: initialSearch,
  notices,
  labels,
}: BoardIndexContentProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }
    router.push(`/index/${boardId}?${params.toString()}`);
  };

  const getBaseUrl = () => {
    const params = new URLSearchParams();
    if (initialSearch) {
      params.set("search", initialSearch);
    }
    const queryString = params.toString();
    return `/index/${boardId}${queryString ? `?${queryString}` : ""}`;
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

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${month}-${day}`;
  };

  const sidebar = <BoardListSidebar boards={boards} title="Boards" />;
  const rightContent = (
    <>
      <ThemeToggleButton />
      {canAccessAdmin && <AdminButton />}
      <AuthButton
        isLoggedIn={isLoggedIn}
        loginLabel={authLabels.login}
        logoutLabel={authLabels.logout}
      />
    </>
  );

  return (
    <PageLayout title={boardName} sidebar={sidebar} rightContent={rightContent}>
      <Container>
        {notices.length > 0 && (
        <NoticesSection>
          <NoticesHeader>
            <NoticesTitle>{labels.notices}</NoticesTitle>
            <MoreLink href={`/notice/${boardId}`}>{labels.moreNotices}</MoreLink>
          </NoticesHeader>
          <NoticeList>
            {notices.map((notice) => (
              <NoticeItem key={notice.id}>
                {notice.pinned && <PinnedBadge>{labels.pinned}</PinnedBadge>}
                <Link href={`/notice/${boardId}/${notice.id}`}>
                  {notice.title}
                </Link>
                <NoticeDate>{formatShortDate(notice.createdAt)}</NoticeDate>
              </NoticeItem>
            ))}
          </NoticeList>
        </NoticesSection>
      )}

      <ActionsBar>
        <CreateButton href={`/index/${boardId}/create`}>
          {labels.createThread}
        </CreateButton>
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

      {threads.length === 0 ? (
        <EmptyState>{initialSearch ? labels.noResults : labels.noThreads}</EmptyState>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th style={{ width: "8%" }}>{labels.id}</Th>
                <Th style={{ width: "37%" }}>{labels.threadTitle}</Th>
                <Th style={{ width: "12%" }}>{labels.author}</Th>
                <Th style={{ width: "20%" }}>{labels.createdAt}</Th>
                <Th style={{ width: "20%" }}>{labels.updatedAt}</Th>
              </tr>
            </thead>
            <tbody>
              {threads.map((thread) =>
                thread.top ? (
                  <TopRow key={thread.id}>
                    <Td>{thread.id}</Td>
                    <TitleCell>
                      <Badge $variant="top">{labels.top}</Badge>
                      {thread.ended && (
                        <Badge $variant="ended">{labels.ended}</Badge>
                      )}
                      <Link href={`/trace/${thread.id}/recent`}>
                        {thread.title}
                      </Link>
                      <span> ({Math.max(0, thread.responseCount - 1)})</span>
                    </TitleCell>
                    <Td>{thread.username}</Td>
                    <DateCell>{formatDate(thread.createdAt)}</DateCell>
                    <DateCell>{formatDate(thread.updatedAt)}</DateCell>
                  </TopRow>
                ) : (
                  <tr key={thread.id}>
                    <Td>{thread.id}</Td>
                    <TitleCell>
                      {thread.ended && (
                        <Badge $variant="ended">{labels.ended}</Badge>
                      )}
                      <Link href={`/trace/${thread.id}/recent`}>
                        {thread.title}
                      </Link>
                      <span> ({Math.max(0, thread.responseCount - 1)})</span>
                    </TitleCell>
                    <Td>{thread.username}</Td>
                    <DateCell>{formatDate(thread.createdAt)}</DateCell>
                    <DateCell>{formatDate(thread.updatedAt)}</DateCell>
                  </tr>
                )
              )}
            </tbody>
          </Table>
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
