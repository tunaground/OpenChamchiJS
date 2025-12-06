"use client";

import Link from "next/link";
import styled from "styled-components";

const Page = styled.div`
  min-height: 100vh;
  padding: 2rem;
  background-color: ${(props) => props.theme.background};
`;

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2rem;
  color: ${(props) => props.theme.textPrimary};
`;

const Section = styled.section`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1rem;
  font-weight: 500;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 1rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const NavList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const NavItem = styled.li`
  a {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: ${(props) => props.theme.surface};
    border: 1px solid ${(props) => props.theme.surfaceBorder};
    border-radius: 8px;
    color: ${(props) => props.theme.textPrimary};
    text-decoration: none;
    transition: background 0.2s;

    &:hover {
      background: ${(props) => props.theme.surfaceHover};
    }
  }
`;

const NavPath = styled.code`
  font-size: 0.875rem;
  color: ${(props) => props.theme.textSecondary};
  background: ${(props) => props.theme.surfaceHover};
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  min-width: 160px;
`;

const NavLabel = styled.span`
  font-weight: 500;
`;

export default function Home() {
  const mainPages = [
    { path: "/login", label: "Login" },
    { path: "/dashboard", label: "Dashboard" },
  ];

  const adminPages = [
    { path: "/admin", label: "Admin Overview" },
    { path: "/admin/boards", label: "Board Management" },
  ];

  const setupPages = [
    { path: "/setup", label: "Initial Setup" },
    { path: "/setup/complete", label: "Setup Complete" },
  ];

  const testPages = [
    { path: "/test/theme", label: "Theme Demo" },
    { path: "/test/tom", label: "TOM Parser Demo" },
  ];

  return (
    <Page>
      <Container>
        <Title>ChamchiJS</Title>

        <Section>
          <SectionTitle>Main</SectionTitle>
          <NavList>
            {mainPages.map(({ path, label }) => (
              <NavItem key={path}>
                <Link href={path}>
                  <NavPath>{path}</NavPath>
                  <NavLabel>{label}</NavLabel>
                </Link>
              </NavItem>
            ))}
          </NavList>
        </Section>

        <Section>
          <SectionTitle>Admin</SectionTitle>
          <NavList>
            {adminPages.map(({ path, label }) => (
              <NavItem key={path}>
                <Link href={path}>
                  <NavPath>{path}</NavPath>
                  <NavLabel>{label}</NavLabel>
                </Link>
              </NavItem>
            ))}
          </NavList>
        </Section>

        <Section>
          <SectionTitle>Setup</SectionTitle>
          <NavList>
            {setupPages.map(({ path, label }) => (
              <NavItem key={path}>
                <Link href={path}>
                  <NavPath>{path}</NavPath>
                  <NavLabel>{label}</NavLabel>
                </Link>
              </NavItem>
            ))}
          </NavList>
        </Section>

        <Section>
          <SectionTitle>Test</SectionTitle>
          <NavList>
            {testPages.map(({ path, label }) => (
              <NavItem key={path}>
                <Link href={path}>
                  <NavPath>{path}</NavPath>
                  <NavLabel>{label}</NavLabel>
                </Link>
              </NavItem>
            ))}
          </NavList>
        </Section>
      </Container>
    </Page>
  );
}
