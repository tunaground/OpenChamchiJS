"use client";

import Link from "next/link";
import styled from "styled-components";

const Container = styled.div`
  min-height: 100vh;
  padding: 3.2rem;
  max-width: 80rem;
  margin: 0 auto;
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

interface NoticeDetailContentProps {
  boardId: string;
  boardName: string;
  notice: NoticeData;
  labels: Labels;
}

export function NoticeDetailContent({
  boardId,
  notice,
  labels,
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

  return (
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
  );
}
