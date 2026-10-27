"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import styled from "styled-components";
import { Pagination } from "@/components/Pagination";
import { PageLayout } from "@/components/layout";
import { PageContainer } from "@/components/layout/PageContainer";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";
import { usePresence } from "@/lib/hooks/usePresence";
import { CHANNELS } from "@/lib/realtime";
import { formatDate, formatDateTime } from "@/lib/utils/date-formatter";
import { formatRelativeTime } from "@/lib/utils/relative-time";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMagnifyingGlass, faPlus } from "@fortawesome/free-solid-svg-icons";
import CustomHtml from "@/components/CustomHtml";

const Container = PageContainer;

const Notices = styled.ul`
  list-style: none;
  border: 1px solid ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusControl};
  background: ${(props) => props.theme.paneSunken};
  font-size: 1.4rem;
`;

const NoticeItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1.2rem;
  border-top: 1px solid ${(props) => props.theme.line};

  &:first-child {
    border-top: none;
  }

  a {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${(props) => props.theme.textPrimary};

    &:hover {
      color: ${(props) => props.theme.accent};
    }
  }
`;

const NoticeDate = styled.time`
  flex-shrink: 0;
  font-size: 1.3rem;
  color: ${(props) => props.theme.textMuted};
`;

const NoticesFoot = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.4rem;

  a {
    padding: 0.2rem 0.4rem;
    font-size: 1.3rem;
    color: ${(props) => props.theme.textSecondary};

    &:hover {
      color: ${(props) => props.theme.accent};
    }
  }
`;

const Chip = styled.span<{ $tone?: "accent" | "muted" }>`
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  height: 2rem;
  padding: 0 0.6rem;
  border-radius: ${(props) => props.theme.radiusChip};
  font-size: 1.2rem;
  font-weight: 500;
  vertical-align: 0.1rem;
  background: ${(props) => (props.$tone === "accent" ? props.theme.accentSoft : props.theme.paneSunken)};
  color: ${(props) => (props.$tone === "accent" ? props.theme.accent : props.theme.textSecondary)};
  border: 1px solid ${(props) => (props.$tone === "accent" ? "transparent" : props.theme.line)};
`;

const CustomHtmlSlot = styled.div`
  margin: 1.6rem 0;
`;

const columns = "5.6rem minmax(0, 1fr) 7.2rem 11.2rem";

const ListHead = styled.div`
  display: grid;
  grid-template-columns: ${columns};
  gap: 1.2rem;
  margin-top: 1.6rem;
  padding: 0 1.2rem 0.8rem;
  font-size: 1.2rem;
  color: ${(props) => props.theme.textMuted};
  border-bottom: 1px solid ${(props) => props.theme.line};

  span:nth-child(n + 3) {
    text-align: right;
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

const Row = styled.div<{ $top?: boolean; $ended?: boolean }>`
  display: grid;
  grid-template-columns: ${columns};
  align-items: center;
  gap: 1.2rem;
  padding: 1rem 1.2rem;
  border-bottom: 1px solid ${(props) => props.theme.line};
  background: ${(props) => (props.$top ? props.theme.accentSoft : "transparent")};

  &:hover {
    background: ${(props) => (props.$top ? props.theme.accentSoft : props.theme.hover)};
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    grid-template-columns: minmax(0, 1fr) auto;
    row-gap: 0.2rem;
    padding: 1.2rem 0.6rem;
  }
`;

const RowNo = styled.span<{ $top?: boolean }>`
  font-size: 1.3rem;
  color: ${(props) => (props.$top ? props.theme.accent : props.theme.textMuted)};
  font-weight: ${(props) => (props.$top ? 500 : 400)};

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

const RowMain = styled.div`
  min-width: 0;
`;

const RowTitle = styled(Link)<{ $ended?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  font-weight: 500;
  color: ${(props) => (props.$ended ? props.theme.textMuted : props.theme.textPrimary)};

  span:last-child {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &:hover {
    color: ${(props) => props.theme.accent};
  }

  /* On desktop the number column already says "top" */
  .m-top {
    display: none;
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    span:last-child {
      white-space: normal;
    }

    .m-top {
      display: inline-flex;
    }
  }
`;

const RowSub = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.1rem;
  font-size: 1.3rem;
  color: ${(props) => props.theme.textMuted};
`;

const RowCount = styled(Link)`
  justify-self: end;
  padding: 0.2rem 0.6rem;
  margin-right: -0.6rem;
  border-radius: ${(props) => props.theme.radiusChip};
  font-size: 1.4rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};

  &:hover {
    background: ${(props) => props.theme.accentSoft};
    color: ${(props) => props.theme.accent};
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    grid-row: 1;
    grid-column: 2;
    align-self: start;
  }
`;

const RowWhen = styled.time`
  justify-self: end;
  font-size: 1.3rem;
  color: ${(props) => props.theme.textSecondary};
  white-space: nowrap;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    justify-self: start;
    grid-column: 1 / -1;
    font-size: 1.2rem;
    color: ${(props) => props.theme.textMuted};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4.8rem 0;
  color: ${(props) => props.theme.textSecondary};
`;

const SearchForm = styled.form`
  position: relative;
  display: flex;
  align-items: center;

  svg {
    position: absolute;
    left: 0.9rem;
    width: 1.4rem;
    color: ${(props) => props.theme.textMuted};
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 22rem;
  height: 3.2rem;
  padding: 0 1rem 0 3rem;
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

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    width: 100%;
  }
`;

/** Search sits in the toolbar on desktop and above the list on mobile */
const DesktopOnly = styled.div`
  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

const MobileOnly = styled.div`
  display: none;
  margin-bottom: 1.2rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: block;
  }
`;

const CreateButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  height: 3.2rem;
  margin-left: 0.6rem;
  padding: 0 1.2rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border-radius: ${(props) => props.theme.radiusControl};
  font-size: 1.4rem;
  font-weight: 500;
  white-space: nowrap;

  &:hover {
    filter: brightness(1.06);
  }

  svg {
    width: 1.4rem;
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    width: 3.2rem;
    padding: 0;
    justify-content: center;

    span {
      display: none;
    }
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
  isGlobal: boolean;
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
  globalNotice: string;
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

interface BoardIndexContentProps {
  boardId: string;
  boardName: string;
  boards: BoardData[];
  realtimeEnabled: boolean;
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: AuthLabels;
  threads: ThreadData[];
  pagination: PaginationData;
  search: string;
  notices: NoticeData[];
  labels: Labels;
  boardsTitle: string;
  manualLabel: string;
  customLinks?: CustomLink[];
  indexCustomHtml?: string | null;
}

export function BoardIndexContent({
  boardId,
  boardName,
  boards,
  realtimeEnabled,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  threads,
  pagination,
  search: initialSearch,
  notices,
  labels,
  boardsTitle,
  manualLabel,
  customLinks,
  indexCustomHtml,
}: BoardIndexContentProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("boardIndex");
  const [search, setSearch] = useState(initialSearch);

  // Presence tracking for user counter (board level for /index page)
  // Always enabled on /index page if realtime is configured
  const boardChannel = CHANNELS.board(boardId);
  const { memberCount: boardMemberCount } = usePresence(boardChannel, realtimeEnabled);

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

  const sidebar = <BoardListSidebar boards={boards} customLinks={customLinks} title={boardsTitle} manualLabel={manualLabel} />;

  const searchForm = (
    <SearchForm onSubmit={handleSearch} role="search">
      <FontAwesomeIcon icon={faMagnifyingGlass} />
      <SearchInput
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={labels.searchPlaceholder}
        aria-label={labels.searchButton}
      />
    </SearchForm>
  );

  return (
    <PageLayout
      title={boardName}
      toolbarActions={
        <>
          <DesktopOnly>{searchForm}</DesktopOnly>
          <CreateButton prefetch={false} href={`/index/${boardId}/create`} title={labels.createThread}>
            <FontAwesomeIcon icon={faPlus} />
            <span>{labels.createThread}</span>
          </CreateButton>
        </>
      }
      sidebar={sidebar}
      isLoggedIn={isLoggedIn}
      canAccessAdmin={canAccessAdmin}
      authLabels={authLabels}
      userCount={realtimeEnabled ? boardMemberCount : undefined}
    >
      <Container>
        <MobileOnly>{searchForm}</MobileOnly>

        {notices.length > 0 && (
          <section aria-label={labels.notices}>
            <Notices>
              {notices.map((notice) => (
                <NoticeItem key={notice.id}>
                  {notice.pinned && <Chip $tone="accent">{labels.pinned}</Chip>}
                  {notice.isGlobal && <Chip>{labels.globalNotice}</Chip>}
                  <Link prefetch={false} href={`/notice/${boardId}/${notice.id}`}>
                    {notice.title}
                  </Link>
                  <NoticeDate dateTime={notice.createdAt} suppressHydrationWarning>
                    {formatRelativeTime(notice.createdAt, locale)}
                  </NoticeDate>
                </NoticeItem>
              ))}
            </Notices>
            <NoticesFoot>
              <Link prefetch={false} href={`/notice/${boardId}`}>{labels.moreNotices}</Link>
            </NoticesFoot>
          </section>
        )}

        {indexCustomHtml && (
          <CustomHtmlSlot>
            <CustomHtml html={indexCustomHtml} />
          </CustomHtmlSlot>
        )}

        {threads.length === 0 ? (
          <EmptyState>{initialSearch ? labels.noResults : labels.noThreads}</EmptyState>
        ) : (
          <>
            <ListHead aria-hidden>
              <span>{t("number")}</span>
              <span>{labels.threadTitle}</span>
              <span>{t("responses")}</span>
              <span>{t("lastResponse")}</span>
            </ListHead>
            {threads.map((thread) => (
              <Row key={thread.id} $top={thread.top}>
                <RowNo $top={thread.top}>{thread.top ? labels.top : thread.id}</RowNo>
                <RowMain>
                  {/* Title opens the latest responses; the count opens the whole thread */}
                  <RowTitle prefetch={false} href={`/trace/${boardId}/${thread.id}/recent`} $ended={thread.ended}>
                    {thread.top && <Chip $tone="accent" className="m-top">{labels.top}</Chip>}
                    {thread.ended && <Chip>{labels.ended}</Chip>}
                    <span>{thread.title}</span>
                  </RowTitle>
                  <RowSub>
                    <span>{thread.username}</span>
                    <time dateTime={thread.createdAt}>{formatDate(thread.createdAt)}</time>
                  </RowSub>
                </RowMain>
                <RowCount prefetch={false} href={`/trace/${boardId}/${thread.id}/`} title={t("viewAllResponses")}>
                  {Math.max(0, thread.responseCount - 1)}
                </RowCount>
                <RowWhen dateTime={thread.updatedAt} title={formatDateTime(thread.updatedAt, locale)} suppressHydrationWarning>
                  {formatRelativeTime(thread.updatedAt, locale)}
                </RowWhen>
              </Row>
            ))}

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
