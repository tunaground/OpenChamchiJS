"use client";

import styled from "styled-components";
import { PageLayout, AdminButton, AuthButton, ThemeToggleButton } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";

const Container = styled.div`
  padding: 3.2rem;
  max-width: 1000px;
  margin: 0 auto;
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
}

export function HomeContent({
  boards,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
}: HomeContentProps) {
  const sidebar = <BoardListSidebar boards={boards} title="Boards" />;
  const rightContent = (
    <>
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
    <PageLayout title="Home" sidebar={sidebar} rightContent={rightContent}>
      <Container />
    </PageLayout>
  );
}
