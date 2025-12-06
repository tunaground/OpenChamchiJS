"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { PageLayout, AdminButton, AuthButton, ThemeToggleButton } from "@/components/layout";
import { TraceSidebar } from "@/components/sidebar/TraceSidebar";

const Container = styled.div`
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
`;


const ThreadHeader = styled.div`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ThreadTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin: 0 0 1rem 0;
`;

const BadgeContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Badge = styled.span<{ $variant?: "top" | "ended" }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${(props) =>
    props.$variant === "ended"
      ? props.theme.textSecondary + "30"
      : props.theme.textPrimary};
  color: ${(props) =>
    props.$variant === "ended"
      ? props.theme.textSecondary
      : props.theme.background};
`;

const ThreadMeta = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
  color: ${(props) => props.theme.textSecondary};
`;

const MetaItem = styled.span`
  display: flex;
  gap: 0.5rem;
`;

const MetaLabel = styled.span`
  color: ${(props) => props.theme.textSecondary};
`;

const MetaValue = styled.span`
  color: ${(props) => props.theme.textPrimary};
`;

const ResponsesSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ResponseCard = styled.div`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  overflow: hidden;
`;

const ResponseHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: ${(props) => props.theme.surfaceHover};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const ResponseInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
`;

const ResponseSeq = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-weight: 500;
`;

const ResponseUsername = styled.span`
  color: ${(props) => props.theme.textPrimary};
  font-weight: 500;
`;

const ResponseAuthorId = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-size: 0.75rem;
`;

const ResponseDate = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-size: 0.75rem;
`;

const ResponseContent = styled.div`
  padding: 1rem;
  font-size: 0.9375rem;
  line-height: 1.6;
  color: ${(props) => props.theme.textPrimary};
  white-space: pre-wrap;
  word-break: break-word;
`;

const ResponseAttachment = styled.div`
  padding: 0 1rem 1rem;
`;

const AttachmentLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: ${(props) => props.theme.surfaceHover};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  color: ${(props) => props.theme.textPrimary};
  text-decoration: none;
  font-size: 0.875rem;

  &:hover {
    background: ${(props) => props.theme.surface};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: ${(props) => props.theme.textSecondary};
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
`;

const ResponseForm = styled.form`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 1.5rem;
  margin-top: 1.5rem;
`;


const FormGroup = styled.div`
  flex: 1;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 0.875rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }

  &::placeholder {
    color: ${(props) => props.theme.textSecondary};
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 0.875rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};
  resize: vertical;
  font-family: inherit;
  line-height: 1.5;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }

  &::placeholder {
    color: ${(props) => props.theme.textSecondary};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 0.75rem 1.5rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EndedNotice = styled.div`
  text-align: center;
  padding: 1.5rem;
  color: ${(props) => props.theme.textSecondary};
  background: ${(props) => props.theme.surfaceHover};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  margin-top: 1.5rem;
`;


interface ThreadData {
  id: number;
  boardId: string;
  title: string;
  username: string;
  ended: boolean;
  top: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ResponseData {
  id: string;
  seq: number;
  username: string;
  authorId: string;
  content: string;
  attachment: string | null;
  createdAt: string;
}

interface Labels {
  backToList: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  ended: string;
  top: string;
  noResponses: string;
  usernamePlaceholder: string;
  contentPlaceholder: string;
  submit: string;
  submitting: string;
  threadEnded: string;
}

interface AuthLabels {
  login: string;
  logout: string;
}

interface SidebarLabels {
  navigation: string;
  backToBoard: string;
  viewAll: string;
  viewRecent: string;
  prev: string;
  next: string;
  boards: string;
}

interface ThreadDetailContentProps {
  thread: ThreadData;
  boards: { id: string; name: string }[];
  defaultUsername: string;
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: AuthLabels;
  responses: ResponseData[];
  currentView: string;
  lastSeq: number;
  responsesPerPage: number;
  labels: Labels;
  sidebarLabels: SidebarLabels;
}

export function ThreadDetailContent({
  thread,
  boards,
  defaultUsername,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  responses: initialResponses,
  currentView,
  lastSeq,
  responsesPerPage,
  labels,
  sidebarLabels,
}: ThreadDetailContentProps) {
  const router = useRouter();
  const [responses, setResponses] = useState(initialResponses);
  const [username, setUsername] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setResponses(initialResponses);
  }, [initialResponses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/boards/${thread.boardId}/threads/${thread.id}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim() || undefined,
          content: content.trim(),
        }),
      });

      if (res.ok) {
        setContent("");
        router.refresh();
      } else {
        let errorMessage = "Failed to create response";
        try {
          const data = await res.json();
          console.error("Failed to create response:", data);
          errorMessage = typeof data.error === "string" ? data.error : data.error?.message || errorMessage;
        } catch {
          console.error("Failed to parse error response");
        }
        alert(errorMessage);
      }
    } finally {
      setSubmitting(false);
    }
  };

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

  const sidebar = (
    <TraceSidebar
      threadId={thread.id}
      boardId={thread.boardId}
      currentView={currentView}
      lastSeq={lastSeq}
      responsesPerPage={responsesPerPage}
      boards={boards}
      labels={sidebarLabels}
    />
  );
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
    <PageLayout title={thread.title} sidebar={sidebar} rightContent={rightContent}>
      <Container>
        <ThreadHeader>
          <ThreadTitle>
            {thread.title} ({Math.max(0, responses.length - 1)})
          </ThreadTitle>

          {(thread.top || thread.ended) && (
            <BadgeContainer>
              {thread.top && <Badge $variant="top">{labels.top}</Badge>}
              {thread.ended && <Badge $variant="ended">{labels.ended}</Badge>}
            </BadgeContainer>
          )}

          <ThreadMeta>
            <MetaItem>
              <MetaLabel>{labels.author}:</MetaLabel>
              <MetaValue>{thread.username}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>{labels.updatedAt}:</MetaLabel>
              <MetaValue>{formatDate(thread.updatedAt)}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>{labels.createdAt}:</MetaLabel>
              <MetaValue>{formatDate(thread.createdAt)}</MetaValue>
            </MetaItem>
          </ThreadMeta>
        </ThreadHeader>

        <ResponsesSection>
        {responses.length === 0 ? (
          <EmptyState>{labels.noResponses}</EmptyState>
        ) : (
          responses.map((response) => (
            <ResponseCard key={response.id}>
              <ResponseHeader>
                <ResponseInfo>
                  <ResponseSeq>#{response.seq}</ResponseSeq>
                  <ResponseUsername>{response.username}</ResponseUsername>
                  <ResponseAuthorId>({response.authorId})</ResponseAuthorId>
                </ResponseInfo>
                <ResponseDate>{formatDate(response.createdAt)}</ResponseDate>
              </ResponseHeader>
              <ResponseContent>{response.content}</ResponseContent>
              {response.attachment && (
                <ResponseAttachment>
                  <AttachmentLink
                    href={response.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📎 Attachment
                  </AttachmentLink>
                </ResponseAttachment>
              )}
            </ResponseCard>
          ))
        )}
      </ResponsesSection>

      {thread.ended ? (
        <EndedNotice>{labels.threadEnded}</EndedNotice>
      ) : (
        <ResponseForm onSubmit={handleSubmit}>
          <FormGroup style={{ marginBottom: "1rem" }}>
            <FormInput
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={labels.usernamePlaceholder}
            />
          </FormGroup>
          <FormGroup style={{ marginBottom: "1rem" }}>
            <FormTextarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={labels.contentPlaceholder}
              required
            />
          </FormGroup>
          <SubmitButton
            type="submit"
            disabled={submitting || !content.trim()}
          >
            {submitting ? labels.submitting : labels.submit}
          </SubmitButton>
        </ResponseForm>
      )}
      </Container>
    </PageLayout>
  );
}
