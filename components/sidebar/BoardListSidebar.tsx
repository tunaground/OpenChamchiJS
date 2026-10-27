"use client";

import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import {
  SidebarTitle,
  NavList,
  NavItem,
  NavLink,
  NavIcon,
  NavLabel,
  EmptyState,
  ExternalNavLink,
  ExternalIcon,
} from "./SidebarStyles";

interface Board {
  id: string;
  name: string;
}

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

interface BoardsNavProps {
  boards: Board[];
  title: string;
  emptyMessage?: string;
  /** Board to highlight when the path alone doesn't say (e.g. a thread page) */
  currentBoardId?: string;
}

/** Board list group, shared by the board-list and thread sidebars */
export function BoardsNav({ boards, title, emptyMessage = "No boards", currentBoardId }: BoardsNavProps) {
  const pathname = usePathname();

  return (
    <>
      <SidebarTitle>{title}</SidebarTitle>
      {boards.length === 0 ? (
        <EmptyState>{emptyMessage}</EmptyState>
      ) : (
        <NavList>
          {boards.map((board) => {
            const href = `/index/${board.id}`;
            const isActive =
              board.id === currentBoardId || pathname === href || pathname.startsWith(`${href}/`);
            return (
              <NavItem key={board.id}>
                <NavLink href={href} $active={isActive}>
                  <NavLabel>{board.name}</NavLabel>
                </NavLink>
              </NavItem>
            );
          })}
        </NavList>
      )}
    </>
  );
}

/** Admin-configured external links */
export function CustomLinksNav({ links }: { links?: CustomLink[] }) {
  const t = useTranslations("common");
  if (!links || links.length === 0) return null;

  return (
    <>
      <SidebarTitle>{t("links")}</SidebarTitle>
      <NavList>
        {links.map((link) => (
          <NavItem key={link.id}>
            <ExternalNavLink href={link.url} target="_blank" rel="noopener noreferrer">
              <NavLabel>{link.label}</NavLabel>
              <ExternalIcon />
            </ExternalNavLink>
          </NavItem>
        ))}
      </NavList>
    </>
  );
}

interface BoardListSidebarProps {
  boards: Board[];
  customLinks?: CustomLink[];
  title?: string;
  emptyMessage?: string;
  manualLabel?: string;
}

export function BoardListSidebar({
  boards,
  customLinks,
  title = "Boards",
  emptyMessage = "No boards",
  manualLabel = "Manual",
}: BoardListSidebarProps) {
  const pathname = usePathname();

  return (
    <div>
      <NavList>
        <NavItem>
          <NavLink href="/manual" $active={pathname === "/manual"}>
            <NavIcon>
              <FontAwesomeIcon icon={faBook} />
            </NavIcon>
            <NavLabel>{manualLabel}</NavLabel>
          </NavLink>
        </NavItem>
      </NavList>
      <BoardsNav boards={boards} title={title} emptyMessage={emptyMessage} />
      <CustomLinksNav links={customLinks} />
    </div>
  );
}
