"use client";

import Link from "next/link";
import styled from "styled-components";

export const SidebarTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  color: ${(props) => props.theme.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.2rem;
`;

export const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const NavItem = styled.li`
  margin-bottom: 0.4rem;
`;

export const NavLink = styled(Link)<{ $active?: boolean; $disabled?: boolean }>`
  display: block;
  padding: 1rem 1.2rem;
  border-radius: 0.6rem;
  text-decoration: none;
  font-size: 1.4rem;
  color: ${(props) =>
    props.$disabled
      ? props.theme.textSecondary + "60"
      : props.$active
        ? props.theme.textPrimary
        : props.theme.textSecondary};
  background: ${(props) =>
    props.$active ? props.theme.surfaceHover : "transparent"};
  font-weight: ${(props) => (props.$active ? 500 : 400)};
  transition: background 0.15s, color 0.15s;
  pointer-events: ${(props) => (props.$disabled ? "none" : "auto")};

  &:hover {
    background: ${(props) =>
      props.$disabled ? "transparent" : props.theme.surfaceHover};
    color: ${(props) =>
      props.$disabled
        ? props.theme.textSecondary + "60"
        : props.theme.textPrimary};
  }
`;

export const BackLink = styled(Link)`
  display: block;
  padding: 1rem 1.2rem;
  border-radius: 0.6rem;
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

export const SidebarDivider = styled.hr`
  border: none;
  border-top: 1px solid ${(props) => props.theme.surfaceBorder};
  margin: 1.2rem 0;
`;

export const SidebarSection = styled.div`
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid ${(props) => props.theme.surfaceBorder};
`;

export const SectionTitle = styled.div`
  font-size: 1.4rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
  padding: 0.8rem 1.2rem;
  margin-bottom: 0.4rem;
`;

export const EmptyState = styled.div`
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  padding: 0.8rem 0;
`;
