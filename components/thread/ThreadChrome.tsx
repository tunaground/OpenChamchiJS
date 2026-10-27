"use client";

// Building blocks around the response ledger on the thread page:
// opener header, view bar, filter bar, load-more row, toolbar actions and
// the dock that holds the composer.

import Link from "next/link";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowsRotate,
  faBell,
  faBellSlash,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faFilter,
  faListCheck,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { iconButtonCss } from "@/components/layout/iconButton";
import { buildTraceUrl, type ResponseFilter } from "@/lib/utils/trace-url";
import { getNextRange, getPrevRange, isAtLatestRange } from "@/lib/utils/trace-range";
import { scrollPageTo } from "@/lib/utils/page-scroll";

/* ───────── Opener ───────── */

const Opener = styled.header`
  padding: 0.6rem 0 1.6rem;
`;

/* Thread number leads the title in the same size, lighter and muted */
const ThreadNo = styled.span`
  margin-right: 0.6em;
  font-weight: 400;
  letter-spacing: -0.01em;
  color: ${(props) => props.theme.textMuted};
`;

/* Status chips follow the title on its line */
const TitleChips = styled.span`
  display: inline-flex;
  gap: 0.6rem;
  margin-left: 1rem;
  vertical-align: 0.4rem;
`;

export const Chip = styled.span<{ $tone?: "accent" | "muted" }>`
  display: inline-flex;
  align-items: center;
  height: 2rem;
  padding: 0 0.6rem;
  border-radius: ${(props) => props.theme.radiusChip};
  font-size: 1.2rem;
  font-weight: 500;
  background: ${(props) => (props.$tone === "accent" ? props.theme.accentSoft : props.theme.paneSunken)};
  color: ${(props) => (props.$tone === "accent" ? props.theme.accent : props.theme.textSecondary)};
  border: 1px solid ${(props) => (props.$tone === "accent" ? "transparent" : props.theme.line)};
`;

const Title = styled.h1`
  font-size: 2.6rem;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-all;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    font-size: 2.2rem;
  }
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.6rem;
  margin-top: 0.8rem;
  font-size: 1.3rem;
  color: ${(props) => props.theme.textMuted};

  b {
    color: ${(props) => props.theme.textSecondary};
    font-weight: 500;
  }
`;

interface ThreadOpenerProps {
  threadId: number;
  title: string;
  top: boolean;
  ended: boolean;
  meta: { label: string; value: string }[];
  labels: { top: string; ended: string };
}

export function ThreadOpener({ threadId, title, top, ended, meta, labels }: ThreadOpenerProps) {
  return (
    <Opener>
      <Title>
        <ThreadNo>#{threadId}</ThreadNo>
        {title}
        {(top || ended) && (
          <TitleChips>
            {top && <Chip $tone="accent">{labels.top}</Chip>}
            {ended && <Chip>{labels.ended}</Chip>}
          </TitleChips>
        )}
      </Title>
      <Meta>
        {meta.map((item) => (
          <span key={item.label}>
            {item.label} <b>{item.value}</b>
          </span>
        ))}
      </Meta>
    </Opener>
  );
}

/* ───────── View bar ───────── */

const Bar = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.8rem 0;
  border-top: 1px solid ${(props) => props.theme.line};
  border-bottom: 1px solid ${(props) => props.theme.line};
  font-size: 1.3rem;
`;

const Segmented = styled.div`
  display: inline-flex;
  padding: 0.2rem;
  border-radius: 7px;
  background: ${(props) => props.theme.paneSunken};
  border: 1px solid ${(props) => props.theme.line};
`;

const Segment = styled(Link)<{ $on: boolean }>`
  padding: 0.3rem 1rem;
  border-radius: 5px;
  color: ${(props) => (props.$on ? props.theme.textPrimary : props.theme.textSecondary)};
  background: ${(props) => (props.$on ? props.theme.paneRaised : "transparent")};
  font-weight: ${(props) => (props.$on ? 500 : 400)};
  box-shadow: ${(props) => (props.$on ? "0 1px 2px rgba(0, 0, 0, 0.08)" : "none")};
`;

const Pager = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  margin-left: auto;
`;

const PageLink = styled(Link)<{ $off?: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.8rem;
  border-radius: ${(props) => props.theme.radiusChip};
  color: ${(props) => props.theme.textSecondary};
  opacity: ${(props) => (props.$off ? 0.4 : 1)};
  pointer-events: ${(props) => (props.$off ? "none" : "auto")};

  &:hover {
    background: ${(props) => props.theme.hover};
    color: ${(props) => props.theme.textPrimary};
  }

  svg {
    font-size: 1.1rem;
  }
`;

interface ThreadViewBarProps {
  boardId: string;
  threadId: number;
  currentView: string;
  lastSeq: number;
  responsesPerPage: number;
  filter?: ResponseFilter;
  filterActive: boolean;
  labels: { viewRecent: string; viewAll: string; prev: string; next: string };
}

/** Recent/all switch and previous/next page, mirroring the sidebar */
export function ThreadViewBar({
  boardId,
  threadId,
  currentView,
  lastSeq,
  responsesPerPage,
  filter,
  filterActive,
  labels,
}: ThreadViewBarProps) {
  const href = (view: string) => buildTraceUrl(boardId, threadId, view, filter, filterActive);
  const prev = getPrevRange(currentView, lastSeq, responsesPerPage);
  const next = getNextRange(currentView, lastSeq, responsesPerPage);
  const atLatest = isAtLatestRange(currentView, lastSeq);

  return (
    <Bar>
      <Segmented>
        <Segment prefetch={false} href={href("recent")} $on={currentView === "recent"}>
          {labels.viewRecent}
        </Segment>
        <Segment prefetch={false} href={href("all")} $on={currentView === "all"}>
          {labels.viewAll}
        </Segment>
      </Segmented>
      <Pager>
        <PageLink prefetch={false} href={prev ? href(prev) : "#"} $off={!prev} aria-disabled={!prev}>
          <FontAwesomeIcon icon={faChevronLeft} />
          {labels.prev}
        </PageLink>
        <PageLink prefetch={false} href={href(next)} $off={atLatest} aria-disabled={atLatest}>
          {labels.next}
          <FontAwesomeIcon icon={faChevronRight} />
        </PageLink>
      </Pager>
    </Bar>
  );
}

/* ───────── Filter bar ───────── */

const FilterRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  padding: 0.8rem 0;
  border-bottom: 1px solid ${(props) => props.theme.line};
  font-size: 1.3rem;
  color: ${(props) => props.theme.textMuted};
`;

const FilterChip = styled.span<{ $dimmed: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  height: 2.4rem;
  padding: 0 0.4rem 0 0.8rem;
  border-radius: ${(props) => props.theme.radiusChip};
  background: ${(props) => props.theme.accentSoft};
  color: ${(props) => props.theme.accent};
  opacity: ${(props) => (props.$dimmed ? 0.5 : 1)};
  word-break: break-all;

  small {
    font-size: 1.1rem;
    opacity: 0.7;
  }
`;

const ChipRemove = styled.button`
  display: grid;
  place-items: center;
  width: 1.8rem;
  height: 1.8rem;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: inherit;
  cursor: pointer;

  &:hover {
    background: ${(props) => props.theme.hover};
  }
`;

const FilterToggle = styled.button`
  margin-left: auto;
  padding: 0.2rem 0.8rem;
  border: none;
  border-radius: ${(props) => props.theme.radiusChip};
  background: transparent;
  color: ${(props) => props.theme.textSecondary};
  font-size: 1.3rem;
  cursor: pointer;

  &:hover {
    background: ${(props) => props.theme.hover};
    color: ${(props) => props.theme.textPrimary};
  }
`;

interface ThreadFilterBarProps {
  filter?: ResponseFilter;
  filterActive: boolean;
  onRemoveUsername: (username: string) => void;
  onRemoveAuthorId: (authorId: string) => void;
  onToggleActive: () => void;
  labels: { filter: string; username: string; authorId: string; pause: string; resume: string; remove: string };
}

/** Active name/ID filters, shown above the responses on every screen size */
export function ThreadFilterBar({
  filter,
  filterActive,
  onRemoveUsername,
  onRemoveAuthorId,
  onToggleActive,
  labels,
}: ThreadFilterBarProps) {
  const usernames = filter?.usernames ?? [];
  const authorIds = filter?.authorIds ?? [];
  if (usernames.length === 0 && authorIds.length === 0) return null;

  return (
    <FilterRow aria-label={labels.filter}>
      <FontAwesomeIcon icon={faFilter} title={labels.filter} />
      {usernames.map((username) => (
        <FilterChip key={`u-${username}`} $dimmed={!filterActive}>
          <small>{labels.username}</small>
          {username}
          <ChipRemove type="button" onClick={() => onRemoveUsername(username)} aria-label={labels.remove}>
            <FontAwesomeIcon icon={faXmark} />
          </ChipRemove>
        </FilterChip>
      ))}
      {authorIds.map((authorId) => (
        <FilterChip key={`a-${authorId}`} $dimmed={!filterActive}>
          <small>{labels.authorId}</small>
          {authorId}
          <ChipRemove type="button" onClick={() => onRemoveAuthorId(authorId)} aria-label={labels.remove}>
            <FontAwesomeIcon icon={faXmark} />
          </ChipRemove>
        </FilterChip>
      ))}
      <FilterToggle type="button" onClick={onToggleActive}>
        {filterActive ? labels.pause : labels.resume}
      </FilterToggle>
    </FilterRow>
  );
}

/* ───────── Load more ───────── */

export const LoadMoreRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  padding: 1.2rem 0 1.2rem ${(props) => props.theme.ledgerGutter};
  border-bottom: 1px solid ${(props) => props.theme.line};

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding-left: 0;
  }
`;

export const LoadMoreButton = styled.button<{ $primary?: boolean }>`
  height: 2.8rem;
  padding: 0 1rem;
  border-radius: ${(props) => props.theme.radiusControl};
  border: 1px solid ${(props) => (props.$primary ? props.theme.lineStrong : "transparent")};
  background: transparent;
  color: ${(props) => (props.$primary ? props.theme.textPrimary : props.theme.textSecondary)};
  font-size: 1.3rem;
  font-weight: ${(props) => (props.$primary ? 500 : 400)};
  cursor: pointer;

  &:hover {
    background: ${(props) => props.theme.hover};
    color: ${(props) => props.theme.textPrimary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* ───────── Toolbar actions ───────── */

const ToolButton = styled.button<{ $active?: boolean }>`
  ${iconButtonCss}
`;

/* Desktop has these in the sidebar; on mobile the sidebar is a closed drawer */
const MobileToolButton = styled(ToolButton)`
  @media (min-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

interface ThreadToolbarActionsProps {
  onRefresh: () => void;
  refreshing: boolean;
  watch: { visible: boolean; watched: boolean; label: string; toggle: () => void };
  onManage: () => void;
  labels: { refresh: string; manage: string; scrollUp: string; scrollDown: string };
}

export function ThreadToolbarActions({ onRefresh, refreshing, watch, onManage, labels }: ThreadToolbarActionsProps) {
  return (
    <>
      <MobileToolButton type="button" onClick={() => scrollPageTo("top")} title={labels.scrollUp} aria-label={labels.scrollUp}>
        <FontAwesomeIcon icon={faChevronUp} />
      </MobileToolButton>
      <MobileToolButton type="button" onClick={() => scrollPageTo("bottom")} title={labels.scrollDown} aria-label={labels.scrollDown}>
        <FontAwesomeIcon icon={faChevronDown} />
      </MobileToolButton>
      <ToolButton type="button" onClick={onRefresh} disabled={refreshing} title={labels.refresh} aria-label={labels.refresh}>
        <FontAwesomeIcon icon={faArrowsRotate} spin={refreshing} />
      </ToolButton>
      {watch.visible && (
        <ToolButton type="button" $active={watch.watched} onClick={watch.toggle} title={watch.label} aria-label={watch.label}>
          <FontAwesomeIcon icon={watch.watched ? faBell : faBellSlash} />
        </ToolButton>
      )}
      <ToolButton type="button" onClick={onManage} title={labels.manage} aria-label={labels.manage}>
        <FontAwesomeIcon icon={faListCheck} />
      </ToolButton>
    </>
  );
}

/* ───────── Bottom dock ───────── */

const Dock = styled.div`
  position: relative;
  padding: 1rem 1.2rem 1.2rem;
  background: ${(props) => props.theme.pane};
  border-top: 1px solid ${(props) => props.theme.line};

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 0.8rem;
    backdrop-filter: saturate(160%) blur(24px);
    -webkit-backdrop-filter: saturate(160%) blur(24px);
  }
`;

/* A tall composer (long AA plus preview) scrolls itself instead of pushing past the pane */
const DockBody = styled.div`
  max-height: calc(100vh - 12rem);
  max-height: calc(100dvh - 12rem);
  overflow-y: auto;
`;

/** Sits below the responses as the PageLayout footer */
export function ComposerDock({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <Dock style={style}>
      <DockBody>{children}</DockBody>
    </Dock>
  );
}
