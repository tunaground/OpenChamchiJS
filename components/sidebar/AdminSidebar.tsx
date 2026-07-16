"use client";

import { usePathname } from "next/navigation";
import {
  BackLink,
  SidebarTitle,
  NavList,
  NavItem,
  NavLink,
} from "./SidebarStyles";
import type { AdminSidebarLabels } from "./types";

interface AdminSidebarProps {
  labels: AdminSidebarLabels;
  isAdmin: boolean;
  children?: React.ReactNode;
}

export function AdminSidebar({ labels, isAdmin, children }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div>
      <BackLink href="/">{labels.backToHome}</BackLink>
      <SidebarTitle>{labels.admin}</SidebarTitle>
      <NavList>
        <NavItem>
          <NavLink
            href="/admin/boards"
            $active={pathname.startsWith("/admin/boards")}
          >
            {labels.boards}
          </NavLink>
        </NavItem>
        {isAdmin && (
          <>
            <NavItem>
              <NavLink
                href="/admin/users"
                $active={pathname.startsWith("/admin/users")}
              >
                {labels.users}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                href="/admin/notices"
                $active={pathname.startsWith("/admin/notices")}
              >
                {labels.globalNotices}
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink
                href="/admin/settings"
                $active={pathname.startsWith("/admin/settings")}
              >
                {labels.settings}
              </NavLink>
            </NavItem>
          </>
        )}
      </NavList>
      {children}
    </div>
  );
}
