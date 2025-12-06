"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";

const SidebarTitle = styled.h2`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${(props) => props.theme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NavItem = styled.li`
  margin-bottom: 0.25rem;
`;

const NavLink = styled(Link)<{ $active?: boolean; $disabled?: boolean }>`
  display: block;
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.875rem;
  color: ${(props) =>
    props.$disabled
      ? props.theme.textSecondary + "60"
      : props.$active
        ? props.theme.textPrimary
        : props.theme.textSecondary};
  background: ${(props) =>
    props.$active ? props.theme.surfaceHover : "transparent"};
  font-weight: ${(props) => (props.$active ? 500 : 400)};
  transition: background 0.15s, color 0.15s;
  pointer-events: ${(props) => (props.$disabled ? "none" : "auto")};

  &:hover {
    background: ${(props) =>
      props.$disabled ? "transparent" : props.theme.surfaceHover};
    color: ${(props) =>
      props.$disabled
        ? props.theme.textSecondary + "60"
        : props.theme.textPrimary};
  }
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${(props) => props.theme.surfaceBorder};
  margin: 0.75rem 0;
`;

interface BoardData {
  id: string;
  name: string;
}

interface TraceSidebarProps {
  threadId: number;
  boardId: string;
  currentView: string;
  lastSeq: number;
  responsesPerPage: number;
  boards: BoardData[];
  labels: {
    navigation: string;
    backToBoard: string;
    viewAll: string;
    viewRecent: string;
    prev: string;
    next: string;
    boards: string;
  };
}

export function TraceSidebar({
  threadId,
  boardId,
  currentView,
  lastSeq,
  responsesPerPage,
  boards,
  labels,
}: TraceSidebarProps) {
  const pathname = usePathname();
  // Parse current range from currentView
  const parseCurrentRange = (): { start: number; end: number } | null => {
    if (currentView === "all" || currentView === "recent") {
      return null;
    }
    if (currentView.includes("-")) {
      const [start, end] = currentView.split("-").map(Number);
      return { start, end };
    }
    const seq = Number(currentView);
    if (!isNaN(seq)) {
      return { start: seq, end: seq };
    }
    return null;
  };

  const currentRange = parseCurrentRange();

  // Calculate prev/next ranges
  const getPrevRange = (): string | null => {
    if (!currentRange) {
      // If viewing all or recent, prev goes to first page
      return `1-${responsesPerPage}`;
    }

    const newStart = Math.max(1, currentRange.start - responsesPerPage);
    const newEnd = newStart + responsesPerPage - 1;

    // Can't go before 1
    if (currentRange.start <= 1) {
      return null;
    }

    return `${newStart}-${newEnd}`;
  };

  const getNextRange = (): string => {
    if (!currentRange) {
      // If viewing all or recent, next goes to last page
      const newStart = Math.max(1, lastSeq - responsesPerPage + 1);
      return `${newStart}-${lastSeq}`;
    }

    const newStart = currentRange.end + 1;
    const newEnd = newStart + responsesPerPage - 1;

    // If we're already at or past lastSeq, show the latest page
    if (currentRange.end >= lastSeq) {
      const latestStart = Math.max(1, lastSeq - responsesPerPage + 1);
      return `${latestStart}-${lastSeq}`;
    }

    // If newEnd exceeds lastSeq, cap it
    if (newEnd > lastSeq) {
      return `${newStart}-${lastSeq}`;
    }

    return `${newStart}-${newEnd}`;
  };

  const prevRange = getPrevRange();
  const nextRange = getNextRange();

  const isPrevDisabled = prevRange === null;

  return (
    <div>
      <SidebarTitle>{labels.navigation}</SidebarTitle>
      <NavList>
        <NavItem>
          <NavLink href={`/index/${boardId}`}>
            {labels.backToBoard}
          </NavLink>
        </NavItem>
      </NavList>

      <Divider />

      <NavList>
        <NavItem>
          <NavLink
            href={`/trace/${threadId}`}
            $active={currentView === "all"}
          >
            {labels.viewAll}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            href={`/trace/${threadId}/recent`}
            $active={currentView === "recent"}
          >
            {labels.viewRecent}
          </NavLink>
        </NavItem>
      </NavList>

      <Divider />

      <NavList>
        <NavItem>
          <NavLink
            href={isPrevDisabled ? "#" : `/trace/${threadId}/${prevRange}`}
            $disabled={isPrevDisabled}
          >
            {labels.prev}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink href={`/trace/${threadId}/${nextRange}`}>
            {labels.next}
          </NavLink>
        </NavItem>
      </NavList>

      <Divider />

      <SidebarTitle>{labels.boards}</SidebarTitle>
      <NavList>
        {boards.map((board) => {
          const href = `/index/${board.id}`;
          const isActive = pathname.startsWith(href) || board.id === boardId;
          return (
            <NavItem key={board.id}>
              <NavLink href={href} $active={isActive}>
                {board.name}
              </NavLink>
            </NavItem>
          );
        })}
      </NavList>
    </div>
  );
}
