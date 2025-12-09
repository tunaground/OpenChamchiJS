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

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

interface BoardListSidebarProps {
  boards: Board[];
  customLinks?: CustomLink[];
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

const ExternalNavLink = styled.a`
  display: block;
  padding: 1rem 1.2rem;
  border-radius: 0.6rem;
  text-decoration: none;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  background: transparent;
  font-weight: 400;
  transition: background 0.15s, color 0.15s;

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
    color: ${(props) => props.theme.textPrimary};
  }
`;

export function BoardListSidebar({
  boards,
  customLinks,
  title = "Boards",
  emptyMessage = "No boards",
  manualLabel = "Manual",
}: BoardListSidebarProps) {
  const pathname = usePathname();
  const isManualActive = pathname === "/manual";

  return (
    <div>
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
      <SidebarDivider />
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
      {customLinks && customLinks.length > 0 && (
        <>
          <SidebarDivider />
          <NavList>
            {customLinks.map((link) => (
              <NavItem key={link.id}>
                <ExternalNavLink
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </ExternalNavLink>
              </NavItem>
            ))}
          </NavList>
        </>
      )}
    </div>
  );
}
