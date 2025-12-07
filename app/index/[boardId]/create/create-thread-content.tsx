"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";

const Container = styled.div`
  padding: 3.2rem;
  max-width: 80rem;
  margin: 0 auto;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.6rem;
  }
`;

const Header = styled.div`
  margin-bottom: 3.2rem;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 0.8rem;
`;

const BoardName = styled.span`
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2.4rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const Label = styled.label`
  font-size: 1.4rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
`;

const Input = styled.input`
  padding: 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.6rem;
  background: ${(props) => props.theme.surface};
  color: ${(props) => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }

  &::placeholder {
    color: ${(props) => props.theme.textSecondary};
  }
`;

const Textarea = styled.textarea`
  padding: 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.6rem;
  background: ${(props) => props.theme.surface};
  color: ${(props) => props.theme.textPrimary};
  min-height: 20rem;
  resize: vertical;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }

  &::placeholder {
    color: ${(props) => props.theme.textSecondary};
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.6rem;

  @media (max-width: 60rem) {
    grid-template-columns: 1fr;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 1.6rem;
  justify-content: flex-end;
`;

const Button = styled.button`
  height: 3.5rem;
  padding: 0 2.4rem;
  border-radius: 4px;
  font-size: 1.4rem;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PrimaryButton = styled(Button)`
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;

  &:hover:not(:disabled) {
    opacity: 0.9;
  }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  color: ${(props) => props.theme.textPrimary};
  border: 1px solid ${(props) => props.theme.surfaceBorder};

  &:hover:not(:disabled) {
    background: ${(props) => props.theme.surfaceHover};
  }
`;

const ErrorMessage = styled.div`
  padding: 1.6rem;
  background: #ef444420;
  border: 1px solid #ef4444;
  border-radius: 4px;
  color: #ef4444;
  font-size: 1.4rem;
`;


interface Labels {
  title: string;
  threadTitle: string;
  threadTitlePlaceholder: string;
  username: string;
  usernamePlaceholder: string;
  password: string;
  passwordPlaceholder: string;
  content: string;
  contentPlaceholder: string;
  attachment: string;
  attachmentPlaceholder: string;
  submit: string;
  cancel: string;
  creating: string;
  foreignIpBlocked: string;
  unknownError: string;
}

interface BoardData {
  id: string;
  name: string;
}

interface AuthLabels {
  login: string;
  logout: string;
}

interface CreateThreadContentProps {
  boardId: string;
  boardName: string;
  defaultUsername: string;
  boards: BoardData[];
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  authLabels: AuthLabels;
  labels: Labels;
  boardsTitle: string;
  manualLabel: string;
}

export function CreateThreadContent({
  boardId,
  boardName,
  defaultUsername: _defaultUsername,
  boards,
  isLoggedIn,
  canAccessAdmin,
  authLabels,
  labels,
  boardsTitle,
  manualLabel,
}: CreateThreadContentProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    username: "",
    password: "",
    content: "",
  });

  const sidebar = <BoardListSidebar boards={boards} title={boardsTitle} manualLabel={manualLabel} />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const getErrorMessage = (data: { error: string | object }): string => {
      if (typeof data.error === "string") {
        if (data.error === "FOREIGN_IP_BLOCKED") {
          return labels.foreignIpBlocked;
        }
        return data.error;
      }
      return labels.unknownError;
    };

    try {
      const usernameToSend = formData.username.trim() || undefined;

      // 1. Create thread
      const threadRes = await fetch(`/api/boards/${boardId}/threads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          username: usernameToSend,
          password: formData.password,
        }),
      });

      if (!threadRes.ok) {
        const data = await threadRes.json();
        throw new Error(getErrorMessage(data) || "Failed to create thread");
      }

      const thread = await threadRes.json();

      // 2. Create first response (seq 0)
      const responseRes = await fetch(
        `/api/boards/${boardId}/threads/${thread.id}/responses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: usernameToSend,
            content: formData.content,
            // TODO: attachment
          }),
        }
      );

      if (!responseRes.ok) {
        const data = await responseRes.json();
        throw new Error(getErrorMessage(data) || "Failed to create response");
      }

      // Redirect to thread page (recent view)
      router.push(`/trace/${boardId}/${thread.id}/recent`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <PageLayout
      title={labels.title}
      sidebar={sidebar}
      isLoggedIn={isLoggedIn}
      canAccessAdmin={canAccessAdmin}
      authLabels={authLabels}
    >
      <Container>
        <Header>
          <Title>{labels.title}</Title>
          <BoardName>{boardName}</BoardName>
        </Header>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label>{labels.threadTitle}</Label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder={labels.threadTitlePlaceholder}
              required
              maxLength={200}
            />
          </FormGroup>

          <Row>
            <FormGroup>
              <Label>{labels.username}</Label>
              <Input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder={labels.usernamePlaceholder}
                maxLength={50}
              />
            </FormGroup>

            <FormGroup>
              <Label>{labels.password}</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder={labels.passwordPlaceholder}
                required
                maxLength={100}
              />
            </FormGroup>
          </Row>

          <FormGroup>
            <Label>{labels.content}</Label>
            <Textarea
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              placeholder={labels.contentPlaceholder}
              required
            />
          </FormGroup>

          {/* TODO: Implement file attachment upload feature
          <FormGroup>
            <Label>{labels.attachment}</Label>
            <Input
              type="file"
              placeholder={labels.attachmentPlaceholder}
            />
          </FormGroup>
          */}

          <Actions>
            <SecondaryButton type="button" onClick={handleCancel} disabled={loading}>
              {labels.cancel}
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={loading}>
              {loading ? labels.creating : labels.submit}
            </PrimaryButton>
          </Actions>
        </Form>
      </Container>
    </PageLayout>
  );
}
