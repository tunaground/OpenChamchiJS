"use client";

import { usePathname } from "next/navigation";
import {
  SidebarTitle,
  NavList,
  NavItem,
  NavLink,
} from "@/components/sidebar/SidebarStyles";

interface ArchiveBoard {
  id: string;
  name: string;
}

interface ArchiveBoardListSidebarProps {
  title?: string;
  boards: ArchiveBoard[];
}

export function ArchiveBoardListSidebar({
  title = "Archive",
  boards,
}: ArchiveBoardListSidebarProps) {
  const pathname = usePathname();

  return (
    <div>
      <SidebarTitle>{title}</SidebarTitle>
      <NavList>
        {boards.map((board) => {
          const href = `/archive/${board.id}`;
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
    </div>
  );
}
