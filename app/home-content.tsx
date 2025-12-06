"use client";

import styled from "styled-components";
import { PageLayout, AdminButton, AuthButton, ThemeToggleButton, HomeButton } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";

const Container = styled.div`
  padding: 3.2rem;
  max-width: 1000px;
  margin: 0 auto;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.6rem;
  }
`;

interface BoardData {
  id: string;
  name: string;
}

interface AuthLabels {
  login: string;
  logout: string;
}

interface HomeContentProps {
  boards: BoardData[];
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: AuthLabels;
  boardsTitle: string;
  siteName: string;
}

export function HomeContent({
  boards,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  boardsTitle,
  siteName,
}: HomeContentProps) {
  const sidebar = <BoardListSidebar boards={boards} title={boardsTitle} />;
  const rightContent = (
    <>
      <HomeButton />
      <ThemeToggleButton />
      {canAccessAdmin && <AdminButton />}
      <AuthButton
        isLoggedIn={isLoggedIn}
        loginLabel={authLabels.login}
        logoutLabel={authLabels.logout}
      />
    </>
  );

  return (
    <PageLayout title={siteName} sidebar={sidebar} rightContent={rightContent}>
      <Container />
    </PageLayout>
  );
}
