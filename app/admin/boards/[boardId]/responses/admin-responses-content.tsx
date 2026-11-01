"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import styled from "styled-components";
import { PageLayout } from "@/components/layout";
import { AdminBoardSidebar } from "@/components/sidebar/AdminBoardSidebar";
import { formatDateTime } from "@/lib/utils/date-formatter";
import {
  Container,
  Breadcrumb,
  ActionsBar,
  Button,
  SecondaryButton,
  Badge,
  List,
  Item,
  ItemMeta,
  ItemActions,
  SmallButton,
  EmptyState,
  SearchForm as BaseSearchForm,
  SearchSelect,
  SearchInput,
  Muted,
} from "../../../_components/admin-ui";

const SearchForm = styled(BaseSearchForm)`
  flex-wrap: wrap;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 0.4rem;
`;

const ThreadLink = styled(Link)`
  font-size: 1.5rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-word;

  &:hover {
    color: ${(props) => props.theme.accent};
  }
`;

const CardMeta = styled(ItemMeta)`
  & + & {
    margin-top: 0.2rem;
  }
`;

const ClickableText = styled.span`
  cursor: pointer;

  &:hover {
    color: ${(props) => props.theme.accent};
    text-decoration: underline;
  }
`;

const MonoClickable = styled(ClickableText)`
  font-family: ${(props) => props.theme.fontMono};
  font-size: 1.2rem;
`;

const ClickableUserBadge = styled(Badge)`
  cursor: pointer;

  &:hover {
    filter: brightness(1.1);
  }
`;

const CardContent = styled.div<{ $expanded?: boolean }>`
  margin-top: 0.8rem;
  font-size: 1.4rem;
  line-height: 1.55;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-word;
  white-space: pre-wrap;
  ${(props) => !props.$expanded && `
    max-height: 8rem;
    overflow: hidden;
  `}
`;

const ExpandButton = styled.button`
  margin-top: 0.4rem;
  padding: 0;
  background: none;
  border: none;
  color: ${(props) => props.theme.textSecondary};
  font-size: 1.3rem;
  cursor: pointer;

  &:hover {
    color: ${(props) => props.theme.accent};
  }
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
  ip: string;
  country: string | null;
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
  searchByIp: string;
  ip: string;
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

interface AdminResponseCursor {
  createdAt: string;
  id: string;
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
  settings: string;
  globalNotices: string;
  threads: string;
  responses: string;
  notices: string;
}

interface AdminResponsesContentProps {
  boardId: string;
  boardName: string;
  authLabels: AuthLabels;
  sidebarLabels: SidebarLabels;
  isAdmin: boolean;
  responses: ResponseData[];
  hasMore: boolean;
  nextCursor: AdminResponseCursor | null;
  scanned?: number;
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
  isAdmin,
  responses: initialResponses,
  hasMore: initialHasMore,
  nextCursor: initialNextCursor,
  scanned: initialScanned,
  searchType: initialSearchType,
  search: initialSearch,
  canEdit,
  canDelete,
  labels,
}: AdminResponsesContentProps) {
  const router = useRouter();
  const locale = useLocale();
  const [responses, setResponses] = useState(initialResponses);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState(initialSearchType || "username");
  const [search, setSearch] = useState(initialSearch);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [scanned, setScanned] = useState(initialScanned);
  const [loadingMore, setLoadingMore] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    setResponses(initialResponses);
    setHasMore(initialHasMore);
    setNextCursor(initialNextCursor);
    setScanned(initialScanned);
    setSearchType(initialSearchType || "username");
    setSearch(initialSearch);
  }, [initialResponses, initialHasMore, initialNextCursor, initialScanned, initialSearchType, initialSearch]);

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

  const handleLoadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = new URLSearchParams();
      if (initialSearchType) {
        params.set("searchType", initialSearchType);
      }
      if (initialSearch) {
        params.set("search", initialSearch);
      }
      params.set("cursor", JSON.stringify(nextCursor));

      const res = await fetch(
        `/api/admin/boards/${boardId}/responses?${params.toString()}`
      );
      if (res.ok) {
        const data = await res.json();
        setResponses([...responses, ...data.data]);
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);
        if (data.scanned !== undefined) {
          setScanned(data.scanned);
        }
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
      isAdmin={isAdmin}
    />
  );

  const showScanned = initialSearchType === "content" && scanned !== undefined;

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
        <Breadcrumb>
          <Link prefetch={false} href="/admin/boards">Boards</Link> / {boardName}
        </Breadcrumb>

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
              <option value="ip">{labels.searchByIp}</option>
            </SearchSelect>
            <SearchInput
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels.searchPlaceholder}
            />
            <SecondaryButton type="submit">{labels.searchButton}</SecondaryButton>
          </SearchForm>
        </ActionsBar>

        {responses.length === 0 && !hasMore ? (
          <EmptyState>
            {initialSearch ? labels.noResults : labels.noResponses}
          </EmptyState>
        ) : (
          <>
            <List>
              {responses.map((response) => (
                <Item key={response.id} $deleted={response.deleted}>
                  <CardHeader>
                    <ThreadLink
                      prefetch={false}
                      href={`/trace/${boardId}/${response.threadId}`}
                    >
                      #{response.threadId} {response.threadTitle}
                    </ThreadLink>
                    <Badge>#{response.seq}</Badge>
                    {response.deleted ? (
                      <Badge $tone="danger">{labels.deleted}</Badge>
                    ) : !response.visible ? (
                      <Badge $tone="warning">{labels.hidden}</Badge>
                    ) : (
                      <Badge $tone="success">{labels.visible}</Badge>
                    )}
                  </CardHeader>
                  <CardMeta>
                    <ClickableText onClick={() => handleSearchBy("username", response.username)}>
                      {response.username}
                    </ClickableText>
                    <MonoClickable
                      onClick={() => handleSearchBy("authorId", response.authorId)}
                    >
                      ({response.authorId})
                    </MonoClickable>
                    <MonoClickable
                      onClick={() => handleSearchBy("ip", response.ip)}
                    >
                      {response.ip}{response.country ? ` [${response.country}]` : ""}
                    </MonoClickable>
                    {response.userId && response.userEmail ? (
                      <ClickableUserBadge $tone="accent" onClick={() => handleSearchBy("email", response.userEmail!)}>
                        {labels.user}: {response.userName ?? response.userId}
                      </ClickableUserBadge>
                    ) : response.userId ? (
                      <Badge $tone="accent">
                        {labels.user}: {response.userName ?? response.userId}
                      </Badge>
                    ) : (
                      <Muted>{labels.anonymous}</Muted>
                    )}
                  </CardMeta>
                  <CardMeta>
                    <span>{formatDateTime(response.createdAt, locale)}</span>
                  </CardMeta>
                  <CardContent $expanded={expandedIds.has(response.id)}>
                    {expandedIds.has(response.id)
                      ? response.content
                      : response.content.substring(0, 300)}
                    {!expandedIds.has(response.id) && response.content.length > 300 && "..."}
                  </CardContent>
                  {response.content.length > 300 && (
                    <ExpandButton onClick={() => toggleExpand(response.id)}>
                      {expandedIds.has(response.id) ? "▲ 접기" : "▼ 펼치기"}
                    </ExpandButton>
                  )}
                  <ItemActions>
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
                  </ItemActions>
                </Item>
              ))}
            </List>

            <LoadMoreContainer>
              {showScanned && (
                <SearchProgress>
                  {labels.scannedCount.replace("__COUNT__", String(scanned))}
                  {" | "}
                  {labels.resultCount.replace("__COUNT__", String(responses.length))}
                  {!hasMore && ` | ${labels.searchComplete}`}
                </SearchProgress>
              )}
              {hasMore && (
                <Button onClick={handleLoadMore} disabled={loadingMore}>
                  {loadingMore ? labels.loading : labels.loadMore}
                </Button>
              )}
            </LoadMoreContainer>
          </>
        )}
      </Container>
    </PageLayout>
  );
}
