"use client";

import Link from "next/link";
import styled from "styled-components";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";

const Container = styled.div`
  padding: 3.2rem;
  max-width: 1000px;
  margin: 0 auto;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.6rem;
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
  padding: 2.4rem;
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1.2rem;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin: 0;
`;

const PinnedBadge = styled.span`
  display: inline-block;
  padding: 0.4rem 0.8rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border-radius: 0.4rem;
  font-size: 1.2rem;
  font-weight: 500;
`;

const Meta = styled.div`
  display: flex;
  gap: 2.4rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
`;

const MetaItem = styled.span``;

const Content = styled.div`
  padding: 2.4rem;
  font-size: 1.6rem;
  line-height: 1.75;
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
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

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
                {labels.createdAt}: {formatDate(notice.createdAt)}
              </MetaItem>
              {notice.updatedAt !== notice.createdAt && (
                <MetaItem>
                  {labels.updatedAt}: {formatDate(notice.updatedAt)}
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
