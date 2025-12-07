"use client";

import { usePathname } from "next/navigation";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBook } from "@fortawesome/free-solid-svg-icons";
import {
  SidebarTitle,
  NavList,
  NavItem,
  NavLink,
  SidebarDivider,
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
  manualLabel?: string;
}

const ManualLinkContent = styled.span`
  display: flex;
  align-items: center;
  gap: 0.8rem;
`;

const ManualIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.6rem;
  font-size: 1.4rem;
`;

export function BoardListSidebar({
  boards,
  title = "Boards",
  emptyMessage = "No boards",
  manualLabel = "Manual",
}: BoardListSidebarProps) {
  const pathname = usePathname();
  const isManualActive = pathname === "/manual";

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
      <SidebarDivider />
      <NavList>
        <NavItem>
          <NavLink href="/manual" $active={isManualActive}>
            <ManualLinkContent>
              <ManualIcon>
                <FontAwesomeIcon icon={faBook} />
              </ManualIcon>
              {manualLabel}
            </ManualLinkContent>
          </NavLink>
        </NavItem>
      </NavList>
    </div>
  );
}
