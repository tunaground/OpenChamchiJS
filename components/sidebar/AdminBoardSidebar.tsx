"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import {
  SidebarSection,
  SectionTitle,
  NavList,
  NavItem,
  NavLink,
} from "./SidebarStyles";
import type { AdminBoardSidebarLabels } from "./types";

interface AdminBoardSidebarProps {
  boardId: string;
  boardName: string;
  labels: AdminBoardSidebarLabels;
}

export function AdminBoardSidebar({
  boardId,
  boardName,
  labels,
}: AdminBoardSidebarProps) {
  const pathname = usePathname();

  const boardNavItems = [
    { href: `/admin/boards/${boardId}/threads`, label: labels.threads },
    { href: `/admin/boards/${boardId}/responses`, label: labels.responses },
    { href: `/admin/boards/${boardId}/notices`, label: labels.notices },
  ];

  return (
    <AdminSidebar labels={labels}>
      <SidebarSection>
        <SectionTitle>{boardName}</SectionTitle>
        <NavList>
          {boardNavItems.map((item) => (
            <NavItem key={item.href}>
              <NavLink href={item.href} $active={pathname === item.href}>
                {item.label}
              </NavLink>
            </NavItem>
          ))}
        </NavList>
      </SidebarSection>
    </AdminSidebar>
  );
}
