"use client";

import { usePathname } from "next/navigation";
import {
  SidebarTitle,
  NavList,
  NavItem,
  NavLink,
} from "@/components/sidebar/SidebarStyles";
import { ARCHIVE_CONFIG } from "../_lib/config";

interface ArchiveBoardListSidebarProps {
  title?: string;
}

export function ArchiveBoardListSidebar({
  title = "Archive",
}: ArchiveBoardListSidebarProps) {
  const pathname = usePathname();
  const boards = ARCHIVE_CONFIG.boards;

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
