"use client";

import { usePathname } from "next/navigation";
import {
  SidebarTitle,
  NavList,
  NavItem,
  NavLink,
  EmptyState,
} from "./SidebarStyles";

interface Board {
  id: string;
  name: string;
}

interface BoardListSidebarProps {
  boards: Board[];
  title?: string;
  emptyMessage?: string;
}

export function BoardListSidebar({
  boards,
  title = "Boards",
  emptyMessage = "No boards",
}: BoardListSidebarProps) {
  const pathname = usePathname();

  return (
    <div>
      <SidebarTitle>{title}</SidebarTitle>
      {boards.length === 0 ? (
        <EmptyState>{emptyMessage}</EmptyState>
      ) : (
        <NavList>
          {boards.map((board) => {
            const href = `/index/${board.id}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <NavItem key={board.id}>
                <NavLink href={href} $active={isActive}>
                  {board.name}
                </NavLink>
              </NavItem>
            );
          })}
        </NavList>
      )}
    </div>
  );
}
