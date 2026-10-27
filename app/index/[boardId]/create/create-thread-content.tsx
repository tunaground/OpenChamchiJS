"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signOutWithPush } from "@/lib/push/client";
import styled from "styled-components";
import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/layout";
import { BoardListSidebar } from "@/components/sidebar/BoardListSidebar";
import { ImageUpload } from "@/components/response/ImageUpload";
import { CreateThreadOptionButtons, CreateThreadOptions } from "@/components/response/CreateThreadOptionButtons";
import { ContentPreview } from "@/components/response/ContentPreview";
import { formatBytes } from "@/lib/utils/format-bytes";
import { applyShortcuts } from "@/lib/utils/shortcuts";
import { PageContainer } from "@/components/layout/PageContainer";

const Container = PageContainer;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
`;

const Label = styled.label`
  font-size: 1.3rem;
  font-weight: 500;
  color: ${(props) => props.theme.textSecondary};
`;

const Input = styled.input<{ $large?: boolean }>`
  height: ${(props) => (props.$large ? "4.4rem" : "3.8rem")};
  padding: 0 1.2rem;
  border: 1px solid ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusControl};
  font-size: ${(props) => (props.$large ? "1.8rem" : "1.5rem")};
  font-weight: ${(props) => (props.$large ? 600 : 400)};
  background: ${(props) => props.theme.paneSunken};
  color: ${(props) => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.accent};
  }

  &::placeholder {
    color: ${(props) => props.theme.textMuted};
    font-weight: 400;
  }
`;

/** Toolbar + textarea framed together like one editor */
const Editor = styled.div`
  border: 1px solid ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusControl};
  background: ${(props) => props.theme.paneSunken};
  overflow: hidden;

  &:focus-within {
    border-color: ${(props) => props.theme.accent};
  }
`;

const EditorBar = styled.div`
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid ${(props) => props.theme.line};
`;

const EditorPreview = styled.div`
  padding: 0 1.2rem;
  border-bottom: 1px dashed ${(props) => props.theme.lineStrong};
`;

const Textarea = styled.textarea<{ $aaMode?: boolean }>`
  display: block;
  width: 100%;
  padding: 1.2rem;
  border: none;
  font-size: 1.5rem;
  background: ${(props) => (props.$aaMode ? "rgba(255, 255, 255)" : "transparent")};
  color: ${(props) => (props.$aaMode ? "black" : props.theme.textPrimary)};
  min-height: 24rem;
  resize: none;
  font-family: ${(props) => (props.$aaMode ? props.theme.fontAA : "inherit")};
  line-height: ${(props) => (props.$aaMode ? "1.6rem" : "1.7")};
  white-space: ${(props) => (props.$aaMode ? "pre" : "pre-wrap")};
  overflow-x: ${(props) => (props.$aaMode ? "auto" : "hidden")};
  overflow-y: hidden;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    ${(props) => props.$aaMode && `
      font-size: 1.2rem;
      line-height: 1.4rem;
    `}
  }

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${(props) => props.theme.textMuted};
  }
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem;

  @media (max-width: 60rem) {
    grid-template-columns: 1fr;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 0.8rem;
  justify-content: flex-end;
`;

const Button = styled.button`
  height: 3.6rem;
  padding: 0 1.6rem;
  border-radius: ${(props) => props.theme.radiusControl};
  font-size: 1.4rem;
  font-weight: 500;
  cursor: pointer;

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
    filter: brightness(1.06);
  }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  color: ${(props) => props.theme.textPrimary};
  border: 1px solid ${(props) => props.theme.lineStrong};

  &:hover:not(:disabled) {
    background: ${(props) => props.theme.hover};
  }
`;

const ErrorMessage = styled.div`
  margin-bottom: 1.6rem;
  padding: 1rem 1.2rem;
  background: color-mix(in srgb, ${(props) => props.theme.error} 8%, transparent);
  border: 1px solid color-mix(in srgb, ${(props) => props.theme.error} 40%, transparent);
  border-radius: ${(props) => props.theme.radiusControl};
  color: ${(props) => props.theme.error};
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
  selectImage: string;
  removeImage: string;
  submit: string;
  cancel: string;
  creating: string;
  foreignIpBlocked: string;
  writeLocked: string;
  unknownError: string;
  aaMode: string;
  previewMode: string;
  preview: string;
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
  tripcodeSalt?: string;
  boards: BoardData[];
  storageEnabled: boolean;
  uploadMaxSize: number;
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
  defaultUsername,
  tripcodeSalt,
  boards,
  storageEnabled,
  uploadMaxSize,
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
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [options, setOptions] = useState<CreateThreadOptions>({
    aaMode: false,
    previewMode: false,
  });

  const [formData, setFormData] = useState({
    title: "",
    username: "",
    password: "",
    content: "",
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight + 4}px`;
    }
  }, []);

  useEffect(() => {
    autoResize();
  }, [formData.content, autoResize]);

  const handleToggleOption = (key: keyof CreateThreadOptions) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Apply AA mode wrapper to content
  const getFinalContent = (content: string) => {
    if (options.aaMode && content.trim()) {
      return `[aa]${content}[/aa]`;
    }
    return content;
  };

  // Preview content (with AA mode applied)
  const previewContent = options.aaMode && formData.content.trim()
    ? `[aa]${formData.content}[/aa]`
    : formData.content;

  const t = useTranslations("createThread");
  const maxSizeLabel = t("maxSize", { size: formatBytes(uploadMaxSize) });

  const sidebar = <BoardListSidebar boards={boards} title={boardsTitle} manualLabel={manualLabel} />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const handleErrorResponse = async (data: { error: string | object }): Promise<string> => {
      if (typeof data.error === "string") {
        // Handle deleted user - sign out and redirect
        if (data.error === "USER_NOT_FOUND") {
          await signOutWithPush({ redirect: true, callbackUrl: "/" });
          return ""; // Won't be shown as we're redirecting
        }
        if (data.error === "FOREIGN_IP_BLOCKED") {
          return labels.foreignIpBlocked;
        }
        if (data.error === "WRITE_LOCKED") {
          return labels.writeLocked;
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
        const errorMsg = await handleErrorResponse(data);
        if (errorMsg) throw new Error(errorMsg);
        return; // Redirecting after signOut
      }

      const thread = await threadRes.json();

      // 2. Create first response (seq 0)
      const finalContent = getFinalContent(formData.content);
      let responseRes: Response;
      if (attachmentFile) {
        const responseFormData = new FormData();
        responseFormData.append("file", attachmentFile);
        responseFormData.append("content", finalContent);
        if (usernameToSend) {
          responseFormData.append("username", usernameToSend);
        }

        responseRes = await fetch(
          `/api/boards/${boardId}/threads/${thread.id}/responses`,
          {
            method: "POST",
            body: responseFormData,
          }
        );
      } else {
        responseRes = await fetch(
          `/api/boards/${boardId}/threads/${thread.id}/responses`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: usernameToSend,
              content: finalContent,
            }),
          }
        );
      }

      if (!responseRes.ok) {
        const data = await responseRes.json();
        const errorMsg = await handleErrorResponse(data);
        if (errorMsg) throw new Error(errorMsg);
        return; // Redirecting after signOut
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
      parent={{ label: boardName, href: `/index/${boardId}` }}
      sidebar={sidebar}
      isLoggedIn={isLoggedIn}
      canAccessAdmin={canAccessAdmin}
      authLabels={authLabels}
    >
      <Container>
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="thread-title">{labels.threadTitle}</Label>
            <Input
              id="thread-title"
              $large
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder={labels.threadTitlePlaceholder}
              spellCheck={false}
              required
              maxLength={200}
            />
          </FormGroup>

          <Row>
            <FormGroup>
              <Label>{labels.username}</Label>
              <Input
                type="text"
                name="username"
                autoComplete="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder={labels.usernamePlaceholder}
                spellCheck={false}
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
            <Editor>
              <EditorBar>
                <CreateThreadOptionButtons
                  options={options}
                  onToggle={handleToggleOption}
                  labels={{
                    aaMode: labels.aaMode,
                    previewMode: labels.previewMode,
                  }}
                />
              </EditorBar>
              {options.previewMode && (
                <EditorPreview>
                  <ContentPreview
                    content={previewContent}
                    emptyLabel={labels.preview}
                    boardId={boardId}
                    username={formData.username}
                    defaultUsername={defaultUsername}
                    tripcodeSalt={tripcodeSalt}
                  />
                </EditorPreview>
              )}
              <Textarea
                data-draft
                ref={textareaRef}
                $aaMode={options.aaMode}
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: applyShortcuts(e.target.value) })
                }
                placeholder={labels.contentPlaceholder}
                spellCheck={false}
                required
              />
            </Editor>
          </FormGroup>

          {storageEnabled && (
            <FormGroup>
              <ImageUpload
                onFileSelect={setAttachmentFile}
                currentFile={attachmentFile}
                maxSizeLabel={maxSizeLabel}
                disabled={loading}
                labels={{
                  selectImage: labels.selectImage,
                  removeImage: labels.removeImage,
                }}
              />
            </FormGroup>
          )}

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
