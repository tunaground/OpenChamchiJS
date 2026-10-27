"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import styled from "styled-components";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";
import { formatDateTime } from "@/lib/utils/date-formatter";

const Container = styled.div`
  width: 100%;
  max-width: 80rem;
  padding: 1.6rem 2.8rem 3.2rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.2rem 1.4rem 2.4rem;
  }
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-bottom: 1.6rem;
  font-size: 1.3rem;
  color: ${(props) => props.theme.textSecondary};

  &:hover {
    color: ${(props) => props.theme.accent};
  }
`;

const Article = styled.article``;

const Header = styled.header`
  padding-bottom: 1.6rem;
  border-bottom: 1px solid ${(props) => props.theme.line};
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  line-height: 1.3;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${(props) => props.theme.textPrimary};
`;

const PinnedBadge = styled.span`
  display: inline-flex;
  align-items: center;
  height: 2rem;
  padding: 0 0.6rem;
  border-radius: ${(props) => props.theme.radiusChip};
  font-size: 1.2rem;
  font-weight: 500;
  background: ${(props) => props.theme.accentSoft};
  color: ${(props) => props.theme.accent};
`;

const Meta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.6rem;
  margin-top: 0.8rem;
  font-size: 1.3rem;
  color: ${(props) => props.theme.textMuted};
`;

const MetaItem = styled.span``;

const Content = styled.div`
  padding-top: 1.6rem;
  font-size: 1.5rem;
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
  const locale = useLocale();

  const sidebar = <BoardListSidebar boards={boards} customLinks={customLinks} title={boardsTitle} manualLabel={manualLabel} />;

  return (
    <PageLayout
      title={notice.title}
      parent={{ label: boardName, href: `/index/${boardId}` }}
      sidebar={sidebar}
      isLoggedIn={isLoggedIn}
      canAccessAdmin={canAccessAdmin}
      authLabels={authLabels}
    >
      <Container>
        <BackLink prefetch={false} href={`/notice/${boardId}`}>&larr; {labels.backToList}</BackLink>

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
