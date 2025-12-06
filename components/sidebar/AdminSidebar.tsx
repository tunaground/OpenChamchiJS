"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";

const BackLink = styled(Link)`
  display: block;
  padding: 1rem 1.2rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  transition: background 0.15s, color 0.15s;
  margin-bottom: 1.2rem;

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
    color: ${(props) => props.theme.textPrimary};
  }
`;

const SidebarTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${(props) => props.theme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.2rem;
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NavItem = styled.li`
  margin-bottom: 0.4rem;
`;

const NavLink = styled(Link)<{ $active?: boolean }>`
  display: block;
  padding: 1rem 1.2rem;
  border-radius: 6px;
  text-decoration: none;
  font-size: 1.4rem;
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
    </div>
  );
}
