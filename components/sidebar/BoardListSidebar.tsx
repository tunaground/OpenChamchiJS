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

const BoardList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const BoardItem = styled.li`
  margin-bottom: 0.25rem;
`;

const BoardLink = styled(Link)<{ $active: boolean }>`
  display: block;
  padding: 0.625rem 0.75rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 0.875rem;
  color: ${(props) =>
    props.$active ? props.theme.textPrimary : props.theme.textSecondary};
  background: ${(props) =>
    props.$active ? props.theme.surfaceHover : "transparent"};
  font-weight: ${(props) => (props.$active ? 500 : 400)};
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
    color: ${(props) => props.theme.textPrimary};
  }
`;

const EmptyState = styled.div`
  font-size: 0.875rem;
  color: ${(props) => props.theme.textSecondary};
  padding: 0.5rem 0;
`;

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
        <BoardList>
          {boards.map((board) => {
            const href = `/index/${board.id}`;
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <BoardItem key={board.id}>
                <BoardLink href={href} $active={isActive}>
                  {board.name}
                </BoardLink>
              </BoardItem>
            );
          })}
        </BoardList>
      )}
    </div>
  );
}
