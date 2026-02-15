"use client";

import styled from "styled-components";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";

const Container = styled.div``;

const ContentWrapper = styled.div`
  font-size: 1.5rem;
  line-height: 1.8;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-word;
`;

interface BoardData {
  id: string;
  name: string;
}

interface AuthLabels {
  login: string;
  logout: string;
}

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

interface HomeContentProps {
  boards: BoardData[];
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: AuthLabels;
  boardsTitle: string;
  siteName: string;
  manualLabel: string;
  homepageContent: string | null;
  customLinks?: CustomLink[];
}

export function HomeContent({
  boards,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  boardsTitle,
  siteName,
  manualLabel,
  homepageContent,
  customLinks,
}: HomeContentProps) {
  const sidebar = <BoardListSidebar boards={boards} customLinks={customLinks} title={boardsTitle} manualLabel={manualLabel} />;

  return (
    <PageLayout
      title={siteName}
      sidebar={sidebar}
      isLoggedIn={isLoggedIn}
      canAccessAdmin={canAccessAdmin}
      authLabels={authLabels}
      isHomePage
    >
      <Container>
        {homepageContent?.trim() && (
          <ContentWrapper dangerouslySetInnerHTML={{ __html: homepageContent }} />
        )}
      </Container>
    </PageLayout>
  );
}
