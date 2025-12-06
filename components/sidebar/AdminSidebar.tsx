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

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NavItem = styled.li`
  margin-bottom: 0.25rem;
`;

const NavLink = styled(Link)<{ $active?: boolean }>`
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

interface AdminSidebarProps {
  labels: {
    admin: string;
    backToHome: string;
    boards: string;
    users: string;
    roles?: string;
    settings?: string;
  };
}

export function AdminSidebar({ labels }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <div>
      <SidebarTitle>{labels.admin}</SidebarTitle>
      <NavList>
        <NavItem>
          <NavLink href="/">{labels.backToHome}</NavLink>
        </NavItem>
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
    </div>
  );
}
