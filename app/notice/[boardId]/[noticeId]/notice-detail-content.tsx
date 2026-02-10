"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import styled from "styled-components";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";
import { formatDateTime } from "@/lib/utils/date-formatter";

const Container = styled.div`
  padding: ${(props) => props.theme.containerPadding};
  max-width: ${(props) => props.theme.contentMaxWidth};
  margin: 0 auto;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: ${(props) => props.theme.containerPadding};
  }
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  color: ${(props) => props.theme.textSecondary};
  text-decoration: none;
  font-size: 1.4rem;
  margin-bottom: 2.4rem;

  &:hover {
    color: ${(props) => props.theme.textPrimary};
  }
`;

const Article = styled.article`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 0.8rem;
  overflow: hidden;
`;

const Header = styled.header`
  padding: 1.2rem 1.6rem;
  background: ${(props) => props.theme.surfaceHover};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.4rem;
`;

const Title = styled.h1`
  font-size: 1.6rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin: 0;
`;

const PinnedBadge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.6rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border-radius: 0.4rem;
  font-size: 1.2rem;
  font-weight: 500;
`;

const Meta = styled.div`
  display: flex;
  gap: 1.2rem;
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
`;

const MetaItem = styled.span``;

const Content = styled.div`
  padding: 1.6rem;
  font-size: 1.5rem;
  line-height: 1.6;
  color: ${(props) => props.theme.textPrimary};
  white-space: pre-wrap;
  word-break: break-word;
`;

interface NoticeData {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Labels {
  backToList: string;
  pinned: string;
  createdAt: string;
  updatedAt: string;
}

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

interface NoticeDetailContentProps {
  boardId: string;
  boardName: string;
  boards: BoardData[];
  customLinks?: CustomLink[];
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: AuthLabels;
  notice: NoticeData;
  labels: Labels;
  boardsTitle: string;
  manualLabel: string;
}

export function NoticeDetailContent({
  boardId,
  boardName,
  boards,
  customLinks,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  notice,
  labels,
  boardsTitle,
  manualLabel,
}: NoticeDetailContentProps) {
  const locale = useLocale();

  const sidebar = <BoardListSidebar boards={boards} customLinks={customLinks} title={boardsTitle} manualLabel={manualLabel} />;

  return (
    <PageLayout
      title={`${notice.title} - ${boardName}`}
      sidebar={sidebar}
      isLoggedIn={isLoggedIn}
      canAccessAdmin={canAccessAdmin}
      authLabels={authLabels}
    >
      <Container>
        <BackLink href={`/notice/${boardId}`}>&larr; {labels.backToList}</BackLink>

        <Article>
          <Header>
            <TitleRow>
              {notice.pinned && <PinnedBadge>{labels.pinned}</PinnedBadge>}
              <Title>{notice.title}</Title>
            </TitleRow>
            <Meta>
              <MetaItem>
                {labels.createdAt}: {formatDateTime(notice.createdAt, locale)}
              </MetaItem>
              {notice.updatedAt !== notice.createdAt && (
                <MetaItem>
                  {labels.updatedAt}: {formatDateTime(notice.updatedAt, locale)}
                </MetaItem>
              )}
            </Meta>
          </Header>
          <Content>{notice.content}</Content>
        </Article>
      </Container>
    </PageLayout>
  );
}
