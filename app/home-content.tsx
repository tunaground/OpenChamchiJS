"use client";

import { useMemo } from "react";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";
import { preparse, prerender, render } from "@/lib/tom";

const Container = styled.div`
  padding: 3.2rem;
  max-width: 1000px;
  margin: 0 auto;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.6rem;
  }
`;

const ContentWrapper = styled.div`
  font-size: 1.5rem;
  line-height: 1.8;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-word;
  white-space: pre-wrap;
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
  const t = useTranslations();
  const sidebar = <BoardListSidebar boards={boards} customLinks={customLinks} title={boardsTitle} manualLabel={manualLabel} />;

  const rendered = useMemo(() => {
    if (!homepageContent?.trim()) {
      return null;
    }

    try {
      const preparsed = preparse(homepageContent);
      const prerendered = prerender(preparsed);
      return render(prerendered, {
        boardId: "",
        threadId: 0,
        setAnchorInfo: () => {},
        t,
      });
    } catch {
      return homepageContent;
    }
  }, [homepageContent, t]);

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
        {rendered && <ContentWrapper>{rendered}</ContentWrapper>}
      </Container>
    </PageLayout>
  );
}
