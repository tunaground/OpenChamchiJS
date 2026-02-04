"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faGear,
  faPersonRunning,
  faClock,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faChevronDown,
  faXmark,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  SidebarTitle as BaseSidebarTitle,
  NavList,
  NavItem,
  NavLink as BaseNavLink,
  SidebarDivider,
} from "./SidebarStyles";
import { useSidebarContext } from "./SidebarContext";

const SidebarTitle = styled(BaseSidebarTitle)`
  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

const StyledNavLink = styled(Link)<{ $active?: boolean; $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-radius: 0.6rem;
  text-decoration: none;
  font-size: 1.4rem;
  color: ${(props) =>
    props.$disabled
      ? props.theme.textSecondary + "60"
      : props.$active
        ? props.theme.textPrimary
        : props.theme.textSecondary};
  background: ${(props) =>
    props.$active ? props.theme.sidebarActive : "transparent"};
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

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    justify-content: center;
    padding: 1.2rem;
  }
`;

interface NavLinkProps {
  href: string;
  $active?: boolean;
  $disabled?: boolean;
  children: React.ReactNode;
}

function NavLink({ href, $active, $disabled, children }: NavLinkProps) {
  const sidebarContext = useSidebarContext();

  const handleClick = () => {
    // Don't close sidebar in compact mode (it stays fixed on mobile)
    if (!sidebarContext?.compactOnMobile) {
      sidebarContext?.onClose();
    }
  };

  return (
    <StyledNavLink
      href={href}
      $active={$active}
      $disabled={$disabled}
      onClick={handleClick}
    >
      {children}
    </StyledNavLink>
  );
}

const NavIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  font-size: 1.4rem;
`;

const NavLabel = styled.span`
  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

const BoardsSection = styled.div`
  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

interface BoardData {
  id: string;
  name: string;
}

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

interface ResponseFilter {
  usernames?: string[];
  authorIds?: string[];
}

interface TraceSidebarProps {
  threadId: number;
  boardId: string;
  currentView: string;
  lastSeq: number;
  responsesPerPage: number;
  boards: BoardData[];
  customLinks?: CustomLink[];
  labels: {
    navigation: string;
    backToBoard: string;
    manageThread: string;
    viewAll: string;
    viewRecent: string;
    prev: string;
    next: string;
    scrollUp: string;
    scrollDown: string;
    boards: string;
    filter: string;
  };
  onManageClick?: () => void;
  filter?: ResponseFilter;
  filterActive?: boolean;
  onRemoveUsernameFilter?: (username: string) => void;
  onRemoveAuthorIdFilter?: (authorId: string) => void;
  onToggleFilterActive?: () => void;
}

const NavButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  width: 100%;
  padding: 1rem 1.2rem;
  border-radius: 0.6rem;
  text-decoration: none;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  background: transparent;
  font-weight: 400;
  transition: background 0.15s, color 0.15s;
  border: none;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
    color: ${(props) => props.theme.textPrimary};
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    justify-content: center;
    padding: 1.2rem;
  }
`;

interface NavItemWithIconProps {
  href?: string;
  icon: IconDefinition;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

function NavItemWithIcon({ href, icon, label, active, disabled, onClick }: NavItemWithIconProps) {
  if (onClick) {
    return (
      <NavItem>
        <NavButton onClick={onClick} $active={active}>
          <NavIcon>
            <FontAwesomeIcon icon={icon} />
          </NavIcon>
          <NavLabel>{label}</NavLabel>
        </NavButton>
      </NavItem>
    );
  }

  return (
    <NavItem>
      <NavLink href={href || "#"} $active={active} $disabled={disabled}>
        <NavIcon>
          <FontAwesomeIcon icon={icon} />
        </NavIcon>
        <NavLabel>{label}</NavLabel>
      </NavLink>
    </NavItem>
  );
}

const ExternalNavLink = styled.a`
  display: block;
  padding: 1rem 1.2rem;
  border-radius: 0.6rem;
  text-decoration: none;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  background: transparent;
  font-weight: 400;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
    color: ${(props) => props.theme.textPrimary};
  }
`;

const FilterSection = styled.div`
  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

const FilterChip = styled.div<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  border-radius: 0.6rem;
  font-size: 1rem;
  color: ${(props) => props.theme.textSecondary};
  background: ${(props) => props.theme.surfaceHover};
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};
`;

const FilterToggleButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  background: ${(props) => props.$active ? props.theme.buttonPrimary : "transparent"};
  border: 1px solid ${(props) => props.$active ? "transparent" : props.theme.surfaceBorder};
  border-radius: 0.4rem;
  cursor: pointer;
  color: ${(props) => props.$active ? props.theme.buttonPrimaryText : props.theme.textSecondary};
  font-size: 1.2rem;
  transition: all 0.15s;

  &:hover {
    opacity: 0.8;
  }
`;

const FilterChipLabel = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
`;

const FilterChipValue = styled.span`
  flex: 1;
  word-break: break-all;
`;

const FilterChipRemove = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${(props) => props.theme.textSecondary};
  font-size: 1.2rem;
  border-radius: 0.4rem;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: ${(props) => props.theme.textPrimary};
    background: ${(props) => props.theme.surface};
  }
`;

export function TraceSidebar({
  threadId,
  boardId,
  currentView,
  lastSeq,
  responsesPerPage,
  boards,
  customLinks,
  labels,
  onManageClick,
  filter,
  filterActive = true,
  onRemoveUsernameFilter,
  onRemoveAuthorIdFilter,
  onToggleFilterActive,
}: TraceSidebarProps) {
  const pathname = usePathname();
  // Parse current range from currentView
  // currentView can be "all", "recent", "5" (single), or "5/10" (range)
  const parseCurrentRange = (): { start: number; end: number } | null => {
    if (currentView === "all" || currentView === "recent") {
      return null;
    }
    if (currentView.includes("/")) {
      const [start, end] = currentView.split("/").map(Number);
      return { start, end };
    }
    const seq = Number(currentView);
    if (!isNaN(seq)) {
      return { start: seq, end: seq };
    }
    return null;
  };

  const currentRange = parseCurrentRange();

  // Calculate prev/next ranges (format: start/end)
  const getPrevRange = (): string | null => {
    if (!currentRange) {
      if (currentView === "recent") {
        // Recent shows last page, so prev should go to the page before that
        const lastPageStart = Math.max(1, lastSeq - responsesPerPage + 1);
        const newStart = Math.max(1, lastPageStart - responsesPerPage);
        const newEnd = newStart + responsesPerPage - 1;
        // If we're already at the beginning, disable prev
        if (lastPageStart <= 1) {
          return null;
        }
        return `${newStart}/${newEnd}`;
      }
      // If viewing all, prev goes to first page
      return `1/${responsesPerPage}`;
    }

    const newStart = Math.max(1, currentRange.start - responsesPerPage);
    const newEnd = newStart + responsesPerPage - 1;

    // Can't go before 1
    if (currentRange.start <= 1) {
      return null;
    }

    return `${newStart}/${newEnd}`;
  };

  const getNextRange = (): string => {
    if (!currentRange) {
      // If viewing all or recent, next goes to last page
      // seq 0 is thread body, responses start from seq 1
      const newStart = Math.max(1, lastSeq - responsesPerPage + 1);
      const newEnd = Math.max(newStart + responsesPerPage - 1, lastSeq);
      return `${newStart}/${newEnd}`;
    }

    const newStart = Math.max(1, currentRange.end + 1);
    const newEnd = newStart + responsesPerPage - 1;

    // If we're already at or past lastSeq, show the latest page
    if (currentRange.end >= lastSeq) {
      const latestStart = Math.max(1, lastSeq - responsesPerPage + 1);
      const latestEnd = Math.max(latestStart + responsesPerPage - 1, lastSeq);
      return `${latestStart}/${latestEnd}`;
    }

    // If newEnd exceeds lastSeq, cap it but ensure valid range
    if (newEnd > lastSeq) {
      return `${newStart}/${Math.max(newEnd, lastSeq)}`;
    }

    return `${newStart}/${newEnd}`;
  };

  const prevRange = getPrevRange();
  const nextRange = getNextRange();

  const isPrevDisabled = prevRange === null;

  return (
    <div>
      <SidebarTitle>{labels.navigation}</SidebarTitle>
      <NavList>
        <NavItemWithIcon
          href={`/index/${boardId}`}
          icon={faArrowLeft}
          label={labels.backToBoard}
        />
        {onManageClick && (
          <NavItemWithIcon
            icon={faGear}
            label={labels.manageThread}
            onClick={onManageClick}
          />
        )}
      </NavList>

      <SidebarDivider />

      <NavList>
        <NavItemWithIcon
          href={`/trace/${boardId}/${threadId}`}
          icon={faPersonRunning}
          label={labels.viewAll}
          active={currentView === "all"}
        />
        <NavItemWithIcon
          href={`/trace/${boardId}/${threadId}/recent`}
          icon={faClock}
          label={labels.viewRecent}
          active={currentView === "recent"}
        />
      </NavList>

      <SidebarDivider />

      <NavList>
        <NavItemWithIcon
          href={isPrevDisabled ? "#" : `/trace/${boardId}/${threadId}/${prevRange}`}
          icon={faChevronLeft}
          label={labels.prev}
          disabled={isPrevDisabled}
        />
        <NavItemWithIcon
          href={`/trace/${boardId}/${threadId}/${nextRange}`}
          icon={faChevronRight}
          label={labels.next}
        />
      </NavList>

      <SidebarDivider />

      <NavList>
        <NavItemWithIcon
          icon={faChevronUp}
          label={labels.scrollUp}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        />
        <NavItemWithIcon
          icon={faChevronDown}
          label={labels.scrollDown}
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })}
        />
      </NavList>

      {filter && (filter.usernames?.length || filter.authorIds?.length) && (
        <FilterSection>
          <SidebarDivider />
          <SidebarTitle style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {labels.filter}
            {onToggleFilterActive && (
              <FilterToggleButton
                $active={filterActive}
                onClick={onToggleFilterActive}
                aria-label={filterActive ? "Disable filter" : "Enable filter"}
              >
                <FontAwesomeIcon icon={filterActive ? faEye : faEyeSlash} />
              </FilterToggleButton>
            )}
          </SidebarTitle>
          <NavList>
            {filter.usernames?.map((username) => (
              <FilterChip key={`u-${username}`} $disabled={!filterActive}>
                <FilterChipLabel>U</FilterChipLabel>
                <FilterChipValue>{username}</FilterChipValue>
                {onRemoveUsernameFilter && (
                  <FilterChipRemove
                    onClick={() => onRemoveUsernameFilter(username)}
                    aria-label={`Remove ${username} filter`}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </FilterChipRemove>
                )}
              </FilterChip>
            ))}
            {filter.authorIds?.map((authorId) => (
              <FilterChip key={`a-${authorId}`} $disabled={!filterActive}>
                <FilterChipLabel>A</FilterChipLabel>
                <FilterChipValue>{authorId}</FilterChipValue>
                {onRemoveAuthorIdFilter && (
                  <FilterChipRemove
                    onClick={() => onRemoveAuthorIdFilter(authorId)}
                    aria-label={`Remove ${authorId} filter`}
                  >
                    <FontAwesomeIcon icon={faXmark} />
                  </FilterChipRemove>
                )}
              </FilterChip>
            ))}
          </NavList>
        </FilterSection>
      )}

      <BoardsSection>
        <SidebarDivider />

        <SidebarTitle>{labels.boards}</SidebarTitle>
        <NavList>
          {boards.map((board) => {
            const href = `/index/${board.id}`;
            const isActive = pathname.startsWith(href) || board.id === boardId;
            return (
              <NavItem key={board.id}>
                <BaseNavLink href={href} $active={isActive}>
                  {board.name}
                </BaseNavLink>
              </NavItem>
            );
          })}
        </NavList>

        {customLinks && customLinks.length > 0 && (
          <>
            <SidebarDivider />
            <NavList>
              {customLinks.map((link) => (
                <NavItem key={link.id}>
                  <ExternalNavLink
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.label}
                  </ExternalNavLink>
                </NavItem>
              ))}
            </NavList>
          </>
        )}
      </BoardsSection>
    </div>
  );
}
