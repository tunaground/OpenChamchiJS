"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Pagination } from "@/components/Pagination";
import { PageLayout } from "@/components/layout";
import { AdminBoardSidebar } from "@/components/sidebar/AdminBoardSidebar";
import { formatDateTime } from "@/lib/utils/date-formatter";

const Container = styled.div`
  padding: 3.2rem;
  max-width: 120rem;
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

const Breadcrumb = styled.div`
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};

  a {
    color: ${(props) => props.theme.textSecondary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const ActionsBar = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1.6rem;
  margin-bottom: 2.4rem;
  flex-wrap: wrap;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    width: 100%;
  }
`;

const SearchSelect = styled.select`
  height: 3.5rem;
  padding: 0 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }
`;

const SearchInput = styled.input`
  flex: 1;
  min-width: 20rem;
  max-width: 30rem;
  padding: 0.8rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    max-width: none;
    min-width: 0;
  }

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }

  &::placeholder {
    color: ${(props) => props.theme.textSecondary};
  }
`;

const Button = styled.button`
  height: 3.5rem;
  padding: 0 1.6rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: 4px;
  font-size: 1.4rem;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResponseCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const ResponseCard = styled.div<{ $deleted?: boolean }>`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 1.2rem;
  opacity: ${(props) => (props.$deleted ? 0.5 : 1)};
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 0.8rem;
`;

const ThreadLink = styled(Link)`
  color: ${(props) => props.theme.textPrimary};
  font-weight: 500;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const SeqBadge = styled.span`
  background: ${(props) => props.theme.surfaceHover};
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 500;
`;

const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 0.8rem;
`;

const UserBadge = styled.span`
  background: ${(props) => props.theme.buttonPrimary}20;
  color: ${(props) => props.theme.buttonPrimary};
  padding: 0.1rem 0.6rem;
  border-radius: 4px;
  font-size: 1.1rem;
`;

const ClickableText = styled.span`
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`;

const ClickableUserBadge = styled(UserBadge)`
  cursor: pointer;

  &:hover {
    opacity: 0.8;
  }
`;

const CardContent = styled.div`
  font-size: 1.3rem;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 0.8rem;
  word-break: break-word;
  white-space: pre-wrap;
  max-height: 8rem;
  overflow: hidden;
`;

const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
`;

const Badge = styled.span<{ $variant?: "visible" | "hidden" | "deleted" }>`
  display: inline-block;
  padding: 0.2rem 0.8rem;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 500;
  background: ${(props) => {
    switch (props.$variant) {
      case "visible":
        return "#22c55e";
      case "hidden":
        return "#f59e0b";
      case "deleted":
        return props.theme.textSecondary + "30";
      default:
        return props.theme.textSecondary;
    }
  }};
  color: ${(props) => {
    switch (props.$variant) {
      case "visible":
        return "white";
      case "hidden":
        return "white";
      case "deleted":
        return props.theme.textSecondary;
      default:
        return props.theme.background;
    }
  }};
`;

const SmallButton = styled.button`
  padding: 0.4rem 0.8rem;
  font-size: 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  background: transparent;
  color: ${(props) => props.theme.textPrimary};

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4.8rem;
  color: ${(props) => props.theme.textSecondary};
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
`;

const LoadMoreContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
  margin-top: 2.4rem;
`;

const SearchProgress = styled.div`
  font-size: 1.3rem;
  color: ${(props) => props.theme.textSecondary};
`;

interface ResponseData {
  id: string;
  threadId: number;
  threadTitle: string;
  seq: number;
  username: string;
  authorId: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  content: string;
  visible: boolean;
  deleted: boolean;
  createdAt: string;
}

interface Labels {
  title: string;
  searchType: string;
  searchByUsername: string;
  searchByAuthorId: string;
  searchByEmail: string;
  searchByContent: string;
  searchPlaceholder: string;
  searchButton: string;
  thread: string;
  seq: string;
  username: string;
  authorId: string;
  user: string;
  anonymous: string;
  content: string;
  createdAt: string;
  status: string;
  actions: string;
  visible: string;
  hidden: string;
  deleted: string;
  hide: string;
  show: string;
  delete: string;
  restore: string;
  noResponses: string;
  noResults: string;
  loadMore: string;
  loading: string;
  scannedCount: string;
  resultCount: string;
  searchComplete: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ContentSearchCursor {
  createdAt: string;
  id: string;
  scanned: number;
}

interface CursorData {
  nextCursor: ContentSearchCursor | null;
  hasMore: boolean;
  scanned: number;
}

interface AuthLabels {
  login: string;
  logout: string;
}

interface SidebarLabels {
  backToHome: string;
  admin: string;
  boards: string;
  users: string;
  roles?: string;
  settings?: string;
  threads: string;
  responses: string;
  notices: string;
}

interface AdminResponsesContentProps {
  boardId: string;
  boardName: string;
  authLabels: AuthLabels;
  sidebarLabels: SidebarLabels;
  responses: ResponseData[];
  pagination?: PaginationData;
  cursor?: CursorData;
  searchType: string;
  search: string;
  canEdit: boolean;
  canDelete: boolean;
  labels: Labels;
}

export function AdminResponsesContent({
  boardId,
  boardName,
  authLabels,
  sidebarLabels,
  responses: initialResponses,
  pagination,
  cursor: initialCursor,
  searchType: initialSearchType,
  search: initialSearch,
  canEdit,
  canDelete,
  labels,
}: AdminResponsesContentProps) {
  const router = useRouter();
  const [responses, setResponses] = useState(initialResponses);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState(initialSearchType || "username");
  const [search, setSearch] = useState(initialSearch);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setResponses(initialResponses);
    setCursor(initialCursor);
    setSearchType(initialSearchType || "username");
    setSearch(initialSearch);
  }, [initialResponses, initialCursor, initialSearchType, initialSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchType) {
      params.set("searchType", searchType);
    }
    if (search.trim()) {
      params.set("search", search.trim());
    }
    router.push(`/admin/boards/${boardId}/responses?${params.toString()}`);
  };

  const handleSearchBy = (type: string, value: string) => {
    router.push(`/admin/boards/${boardId}/responses?searchType=${type}&search=${encodeURIComponent(value)}`);
  };

  const getBaseUrl = () => {
    const params = new URLSearchParams();
    if (initialSearchType) {
      params.set("searchType", initialSearchType);
    }
    if (initialSearch) {
      params.set("search", initialSearch);
    }
    const queryString = params.toString();
    return `/admin/boards/${boardId}/responses${queryString ? `?${queryString}` : ""}`;
  };

  const handleLoadMore = async () => {
    if (!cursor?.nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      params.set("searchType", "content");
      params.set("search", initialSearch);
      params.set("cursor", JSON.stringify(cursor.nextCursor));

      const res = await fetch(
        `/api/admin/boards/${boardId}/responses?${params.toString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setResponses([...responses, ...data.data]);
        setCursor(data.cursor);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const handleToggleVisible = async (response: ResponseData) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/boards/${boardId}/threads/${response.threadId}/responses/${response.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visible: !response.visible }),
        }
      );

      if (res.ok) {
        setResponses(
          responses.map((r) =>
            r.id === response.id ? { ...r, visible: !response.visible } : r
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDeleted = async (response: ResponseData) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/boards/${boardId}/threads/${response.threadId}/responses/${response.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleted: !response.deleted }),
        }
      );

      if (res.ok) {
        setResponses(
          responses.map((r) =>
            r.id === response.id ? { ...r, deleted: !response.deleted } : r
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const sidebar = (
    <AdminBoardSidebar
      boardId={boardId}
      boardName={boardName}
      labels={sidebarLabels}
    />
  );

  const isContentSearch = initialSearchType === "content";

  return (
    <PageLayout
      title={labels.title}
      sidebar={sidebar}
      isLoggedIn={true}
      canAccessAdmin={true}
      authLabels={authLabels}
      isAdminPage
    >
      <Container>
        <Header>
          <Title>{labels.title}</Title>
          <Breadcrumb>
            <Link href="/admin/boards">Boards</Link> / {boardName}
          </Breadcrumb>
        </Header>

        <ActionsBar>
          <SearchForm onSubmit={handleSearch}>
            <SearchSelect
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
            >
              <option value="username">{labels.searchByUsername}</option>
              <option value="authorId">{labels.searchByAuthorId}</option>
              <option value="email">{labels.searchByEmail}</option>
              <option value="content">{labels.searchByContent}</option>
            </SearchSelect>
            <SearchInput
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels.searchPlaceholder}
            />
            <Button type="submit">{labels.searchButton}</Button>
          </SearchForm>
        </ActionsBar>

        {responses.length === 0 ? (
          <EmptyState>
            {initialSearch ? labels.noResults : labels.noResponses}
          </EmptyState>
        ) : (
          <>
            <ResponseCards>
              {responses.map((response) => (
                <ResponseCard key={response.id} $deleted={response.deleted}>
                  <CardHeader>
                    <ThreadLink
                      href={`/trace/${boardId}/${response.threadId}`}
                    >
                      #{response.threadId} {response.threadTitle}
                    </ThreadLink>
                    <SeqBadge>#{response.seq}</SeqBadge>
                    {response.deleted ? (
                      <Badge $variant="deleted">{labels.deleted}</Badge>
                    ) : !response.visible ? (
                      <Badge $variant="hidden">{labels.hidden}</Badge>
                    ) : (
                      <Badge $variant="visible">{labels.visible}</Badge>
                    )}
                  </CardHeader>
                  <CardMeta>
                    <ClickableText onClick={() => handleSearchBy("username", response.username)}>
                      {response.username}
                    </ClickableText>
                    <ClickableText
                      style={{ fontFamily: "monospace", fontSize: "1.1rem" }}
                      onClick={() => handleSearchBy("authorId", response.authorId)}
                    >
                      ({response.authorId})
                    </ClickableText>
                    {response.userId && response.userEmail ? (
                      <ClickableUserBadge onClick={() => handleSearchBy("email", response.userEmail!)}>
                        {labels.user}: {response.userName ?? response.userId}
                      </ClickableUserBadge>
                    ) : response.userId ? (
                      <UserBadge>
                        {labels.user}: {response.userName ?? response.userId}
                      </UserBadge>
                    ) : (
                      <span style={{ opacity: 0.6 }}>{labels.anonymous}</span>
                    )}
                  </CardMeta>
                  <CardMeta>
                    <span>{formatDateTime(response.createdAt)}</span>
                  </CardMeta>
                  <CardContent>
                    {response.content.substring(0, 300)}
                    {response.content.length > 300 && "..."}
                  </CardContent>
                  <CardActions>
                    {canEdit && !response.deleted && response.seq !== 0 && (
                      <SmallButton
                        onClick={() => handleToggleVisible(response)}
                        disabled={loading}
                      >
                        {response.visible ? labels.hide : labels.show}
                      </SmallButton>
                    )}
                    {canDelete && response.seq !== 0 && (
                      <SmallButton
                        onClick={() => handleToggleDeleted(response)}
                        disabled={loading}
                      >
                        {response.deleted ? labels.restore : labels.delete}
                      </SmallButton>
                    )}
                  </CardActions>
                </ResponseCard>
              ))}
            </ResponseCards>

            {isContentSearch && cursor ? (
              <LoadMoreContainer>
                <SearchProgress>
                  {labels.scannedCount.replace("__COUNT__", String(cursor.scanned))}
                  {" | "}
                  {labels.resultCount.replace("__COUNT__", String(responses.length))}
                  {!cursor.hasMore && ` | ${labels.searchComplete}`}
                </SearchProgress>
                {cursor.hasMore && (
                  <Button onClick={handleLoadMore} disabled={loadingMore}>
                    {loadingMore ? labels.loading : labels.loadMore}
                  </Button>
                )}
              </LoadMoreContainer>
            ) : pagination ? (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                baseUrl={getBaseUrl()}
              />
            ) : null}
          </>
        )}
      </Container>
    </PageLayout>
  );
}
