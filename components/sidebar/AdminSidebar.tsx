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
  children?: React.ReactNode;
}

export function AdminSidebar({ labels, children }: AdminSidebarProps) {
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
        <NavItem>
          <NavLink
            href="/admin/users"
            $active={pathname.startsWith("/admin/users")}
          >
            {labels.users}
          </NavLink>
        </NavItem>
        {labels.roles && (
          <NavItem>
            <NavLink
              href="/admin/roles"
              $active={pathname.startsWith("/admin/roles")}
            >
              {labels.roles}
            </NavLink>
          </NavItem>
        )}
        {labels.settings && (
          <NavItem>
            <NavLink
              href="/admin/settings"
              $active={pathname.startsWith("/admin/settings")}
            >
              {labels.settings}
            </NavLink>
          </NavItem>
        )}
      </NavList>
      {children}
    </div>
  );
}
