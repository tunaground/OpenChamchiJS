"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styled from "styled-components";

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

const NavLink = styled(Link)<{ $active: boolean }>`
  display: block;
  padding: 1rem 1.2rem;
  border-radius: 0.6rem;
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

const BoardSection = styled.div`
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const BoardName = styled.div`
  font-size: 1.4rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
  padding: 0.8rem 1.2rem;
  margin-bottom: 0.4rem;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid ${(props) => props.theme.surfaceBorder};
  margin: 1.2rem 0;
`;

interface AdminBoardSidebarProps {
  boardId: string;
  boardName: string;
  labels: {
    backToHome: string;
    admin: string;
    threads: string;
    notices: string;
  };
}

export function AdminBoardSidebar({
  boardId,
  boardName,
  labels,
}: AdminBoardSidebarProps) {
  const pathname = usePathname();

  const boardNavItems = [
    { href: `/admin/boards/${boardId}/threads`, label: labels.threads },
    { href: `/admin/boards/${boardId}/notices`, label: labels.notices },
  ];

  return (
    <div>
      <SidebarTitle>Admin</SidebarTitle>
      <NavList>
        <NavItem>
          <NavLink href="/" $active={false}>
            {labels.backToHome}
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink href="/admin/boards" $active={pathname === "/admin/boards"}>
            {labels.admin}
          </NavLink>
        </NavItem>
      </NavList>
      <BoardSection>
        <BoardName>{boardName}</BoardName>
        <NavList>
          {boardNavItems.map((item) => (
            <NavItem key={item.href}>
              <NavLink href={item.href} $active={pathname === item.href}>
                {item.label}
              </NavLink>
            </NavItem>
          ))}
        </NavList>
      </BoardSection>
    </div>
  );
}
