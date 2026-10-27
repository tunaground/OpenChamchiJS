"use client";

import Link from "next/link";
import styled from "styled-components";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";

const Container = styled.div`
  width: 100%;
  max-width: 96rem;
  margin: 0 auto;
  padding: 2.8rem 2.8rem 3.2rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.6rem 1.4rem 2.4rem;
  }
`;

/* Typography for the admin-written homepage HTML */
const ContentWrapper = styled.div`
  font-size: 1.5rem;
  line-height: 1.8;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-word;

  h1,
  h2 {
    font-size: 3rem;
    line-height: 1.25;
    font-weight: 700;
    letter-spacing: -0.025em;
    max-width: 18em;

    @media (max-width: ${(props) => props.theme.breakpoint}) {
      font-size: 2.4rem;
    }
  }

  h1 + p,
  h2 + p,
  h2 + h3 {
    margin-top: 0.8rem;
    color: ${(props) => props.theme.textSecondary};
    font-weight: 400;
  }

  h3,
  h4 {
    font-size: 1.6rem;
    font-weight: 600;
    margin: 0.4rem 0 0.6rem;
  }

  p + p {
    margin-top: 0.6rem;
  }

  a {
    color: ${(props) => props.theme.accent};

    &:hover {
      text-decoration: underline;
      text-underline-offset: 0.3rem;
    }
  }

  hr {
    border: none;
    border-top: 1px solid ${(props) => props.theme.line};
    margin: 2.4rem 0;
  }

  ul,
  ol {
    padding-left: 2rem;
  }
`;

const Boards = styled.section`
  margin-top: 2.8rem;
`;

const BoardsTitle = styled.h2`
  font-size: 1.3rem;
  font-weight: 500;
  color: ${(props) => props.theme.textMuted};
  margin-bottom: 0.8rem;
`;

const BoardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(20rem, 1fr));
  gap: 0.8rem;
`;

const BoardCard = styled(Link)`
  display: block;
  padding: 1.2rem 1.4rem;
  border: 1px solid ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusControl};
  background: ${(props) => props.theme.paneSunken};
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  transition: border-color 0.15s;

  &:hover {
    border-color: ${(props) => props.theme.lineStrong};
    color: ${(props) => props.theme.accent};
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
    >
      <Container>
        {homepageContent?.trim() && (
          // Admin HTML may carry scripts (e.g. AdSense) that rewrite this markup
          // before hydration; the mismatch is expected and must not be "fixed" back
          <ContentWrapper suppressHydrationWarning dangerouslySetInnerHTML={{ __html: homepageContent }} />
        )}
        {boards.length > 0 && (
          <Boards>
            <BoardsTitle>{boardsTitle}</BoardsTitle>
            <BoardGrid>
              {boards.map((board) => (
                <BoardCard key={board.id} prefetch={false} href={`/index/${board.id}`}>
                  {board.name}
                </BoardCard>
              ))}
            </BoardGrid>
          </Boards>
        )}
      </Container>
    </PageLayout>
  );
}
