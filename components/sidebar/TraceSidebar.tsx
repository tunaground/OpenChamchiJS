"use client";

import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPersonRunning,
  faClock,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  SidebarTitle,
  NavList,
  NavItem,
  NavLink,
  NavButton,
  NavIcon,
  NavLabel,
} from "./SidebarStyles";
import { useSidebarContext } from "./SidebarContext";
import { scrollPageTo } from "@/lib/utils/page-scroll";
import { BoardsNav, CustomLinksNav } from "./BoardListSidebar";
import { buildTraceUrl, type ResponseFilter } from "@/lib/utils/trace-url";
import { getPrevRange, getNextRange } from "@/lib/utils/trace-range";

const PageRow = styled.li`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.2rem;
  margin-bottom: 0.1rem;
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
    viewAll: string;
    viewRecent: string;
    prev: string;
    next: string;
    scrollUp: string;
    scrollDown: string;
    boards: string;
  };
  filter?: ResponseFilter;
  filterActive?: boolean;
}

function NavItemWithIcon({
  href,
  icon,
  label,
  active,
  disabled,
  trailingIcon,
}: {
  href: string;
  icon?: IconDefinition;
  label: string;
  active?: boolean;
  disabled?: boolean;
  trailingIcon?: IconDefinition;
}) {
  return (
    <NavLink href={href} $active={active} $disabled={disabled}>
      {icon && (
        <NavIcon>
          <FontAwesomeIcon icon={icon} />
        </NavIcon>
      )}
      <NavLabel style={trailingIcon ? { textAlign: "right" } : undefined}>{label}</NavLabel>
      {trailingIcon && (
        <NavIcon>
          <FontAwesomeIcon icon={trailingIcon} />
        </NavIcon>
      )}
    </NavLink>
  );
}

export function TraceSidebar({
  threadId,
  boardId,
  currentView,
  lastSeq,
  responsesPerPage,
  boards,
  customLinks,
  labels,
  filter,
  filterActive = true,
}: TraceSidebarProps) {
  const sidebarContext = useSidebarContext();
  const prevRange = getPrevRange(currentView, lastSeq, responsesPerPage);
  const nextRange = getNextRange(currentView, lastSeq, responsesPerPage);

  // Scroll, then close the drawer on mobile so the result is visible
  const scrollTo = (position: "top" | "bottom") => {
    scrollPageTo(position);
    sidebarContext?.onClose();
  };

  // All view links keep the current response filter in the query string
  const viewHref = (view: string) =>
    buildTraceUrl(boardId, threadId, view, filter, filterActive);

  return (
    <div>
      <SidebarTitle style={{ marginTop: "0.4rem" }}>{labels.navigation}</SidebarTitle>
      <NavList>
        <NavItem>
          <NavItemWithIcon
            href={viewHref("recent")}
            icon={faClock}
            label={labels.viewRecent}
            active={currentView === "recent"}
          />
        </NavItem>
        <NavItem>
          <NavItemWithIcon
            href={viewHref("all")}
            icon={faPersonRunning}
            label={labels.viewAll}
            active={currentView === "all"}
          />
        </NavItem>
        <PageRow>
          <NavItemWithIcon
            href={prevRange ? viewHref(prevRange) : "#"}
            icon={faChevronLeft}
            label={labels.prev}
            disabled={prevRange === null}
          />
          <NavItemWithIcon
            href={viewHref(nextRange)}
            label={labels.next}
            trailingIcon={faChevronRight}
          />
        </PageRow>
        <PageRow>
          <NavButton type="button" onClick={() => scrollTo("top")}>
            <NavIcon>
              <FontAwesomeIcon icon={faChevronUp} />
            </NavIcon>
            <NavLabel>{labels.scrollUp}</NavLabel>
          </NavButton>
          <NavButton type="button" onClick={() => scrollTo("bottom")}>
            <NavLabel style={{ textAlign: "right" }}>{labels.scrollDown}</NavLabel>
            <NavIcon>
              <FontAwesomeIcon icon={faChevronDown} />
            </NavIcon>
          </NavButton>
        </PageRow>
      </NavList>

      <BoardsNav boards={boards} title={labels.boards} currentBoardId={boardId} />
      <CustomLinksNav links={customLinks} />
    </div>
  );
}
