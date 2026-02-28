"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { signOut } from "next-auth/react";
import styled from "styled-components";
import { ResponseOptionButtons, ResponsePreview } from "@/components/response";
import { ImageUpload } from "@/components/response/ImageUpload";
import { useTranslations } from "next-intl";
import { formatBytes } from "@/lib/utils/format-bytes";
import { applyShortcuts } from "@/lib/utils/shortcuts";
import type { ResponseOptions } from "@/lib/store/responseOptions";

const ResponseForm = styled.form`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 1.6rem;
  margin-top: 2.4rem;
`;

const FormGroup = styled.div`
  flex: 1;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.8rem 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
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

const FormTextarea = styled.textarea<{ $aaMode?: boolean }>`
  width: 100%;
  min-height: 12rem;
  padding: 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.5rem;
  background: ${(props) => (props.$aaMode ? "rgba(255, 255, 255)" : props.theme.background)};
  color: ${(props) => (props.$aaMode ? "black" : props.theme.textPrimary)};
  resize: none;
  font-family: ${(props) => (props.$aaMode ? '"Saitamaar", sans-serif' : "inherit")};
  line-height: ${(props) => (props.$aaMode ? "1.6rem" : "1.5")};
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
    border-color: ${(props) => props.theme.textSecondary};
  }

  &::placeholder {
    color: ${(props) => props.theme.textSecondary};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  height: 3.5rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: 4px;
  font-size: 1.4rem;
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
  padding: 2.4rem;
  color: ${(props) => props.theme.textSecondary};
  background: ${(props) => props.theme.surfaceHover};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  margin-top: 2.4rem;
`;

interface FormLabels {
  usernamePlaceholder: string;
  contentPlaceholder: string;
  submit: string;
  submitting: string;
  threadEnded: string;
  foreignIpBlocked: string;
  writeLocked: string;
  threadBanned: string;
  unknownError: string;
  selectImage: string;
  removeImage: string;
}

interface ResponseFormSectionProps {
  thread: { id: number; boardId: string; title: string; ended: boolean };
  defaultUsername: string;
  tripcodeSalt?: string;
  responseOptions: ResponseOptions;
  toggleOption: (key: keyof ResponseOptions) => void;
  isGlobalActive: (key: keyof ResponseOptions) => boolean;
  hasThreadOverride: (key: keyof ResponseOptions) => boolean;
  resetAllThreadOptions: () => void;
  realtimeEnabled: boolean;
  storageEnabled: boolean;
  uploadMaxSize: number;
  currentLastSeq: number;
  anonId: string;
  labels: FormLabels;
  alwaysBottomRef: React.RefObject<boolean>;
  isAtBottomRef: React.RefObject<boolean>;
  pageEndRef: React.RefObject<HTMLDivElement | null>;
  onSubmitSuccess: () => void;
}

export function ResponseFormSection({
  thread,
  defaultUsername,
  tripcodeSalt,
  responseOptions,
  toggleOption,
  isGlobalActive,
  hasThreadOverride,
  resetAllThreadOptions,
  realtimeEnabled,
  storageEnabled,
  uploadMaxSize,
  currentLastSeq,
  anonId,
  labels,
  alwaysBottomRef,
  isAtBottomRef,
  pageEndRef,
  onSubmitSuccess,
}: ResponseFormSectionProps) {
  const [username, setUsername] = useState("");
  const [content, setContent] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const tThread = useTranslations("threadDetail");
  const maxSizeLabel = tThread("maxSize", { size: formatBytes(uploadMaxSize) });

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight + 4}px`;
    }
    if (alwaysBottomRef.current && isAtBottomRef.current && pageEndRef.current) {
      pageEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [alwaysBottomRef, isAtBottomRef, pageEndRef]);

  useEffect(() => {
    autoResize();
  }, [content, autoResize]);

  // Load saved username from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`chamchi:username:thread:${thread.id}`);
    if (saved) setUsername(saved);
  }, [thread.id]);

  const getErrorMessage = (data: { error: string | object }): string => {
    if (typeof data.error === "string") {
      if (data.error === "FOREIGN_IP_BLOCKED") return labels.foreignIpBlocked;
      if (data.error === "WRITE_LOCKED") return labels.writeLocked;
      if (data.error === "THREAD_BANNED") return labels.threadBanned;
      return data.error;
    }
    return labels.unknownError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);

    try {
      let finalContent = responseOptions.aaMode
        ? `[aa]${content}[/aa]`
        : content.trim();

      let res: Response;
      if (attachmentFile) {
        const formData = new FormData();
        formData.append("file", attachmentFile);
        formData.append("content", finalContent);
        formData.append("anonId", anonId);
        if (username.trim()) {
          formData.append("username", username.trim());
        }
        if (responseOptions.noupMode) {
          formData.append("noup", "true");
        }

        res = await fetch(`/api/boards/${thread.boardId}/threads/${thread.id}/responses`, {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch(`/api/boards/${thread.boardId}/threads/${thread.id}/responses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: username.trim() || undefined,
            content: finalContent,
            noup: responseOptions.noupMode || undefined,
            anonId,
          }),
        });
      }

      if (res.ok) {
        if (username.trim()) {
          localStorage.setItem(`chamchi:username:thread:${thread.id}`, username.trim());
        }
        setContent("");
        setAttachmentFile(null);
        if (!responseOptions.chatMode) {
          onSubmitSuccess();
        }
      } else {
        let errorMessage = labels.unknownError;
        try {
          const data = await res.json();
          console.error("Failed to create response:", data);

          if (data.error === "USER_NOT_FOUND") {
            await signOut({ redirect: true, callbackUrl: "/" });
            return;
          }

          errorMessage = getErrorMessage(data);
        } catch {
          console.error("Failed to parse error response");
        }
        alert(errorMessage);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : labels.unknownError);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const { quickSubmitKey } = responseOptions;
    if (quickSubmitKey === "none") return;

    const isCtrlEnter = e.key === "Enter" && (e.ctrlKey || e.metaKey);
    const isShiftEnter = e.key === "Enter" && e.shiftKey;

    if (
      (quickSubmitKey === "ctrl" && isCtrlEnter) ||
      (quickSubmitKey === "shift" && isShiftEnter)
    ) {
      e.preventDefault();
      if (content.trim() && !submitting) {
        handleSubmit(e as unknown as React.FormEvent);
      }
    }
  };

  if (thread.ended) {
    return <EndedNotice>{labels.threadEnded}</EndedNotice>;
  }

  return (
    <>
      {responseOptions.previewMode && (
        <ResponsePreview
          content={content}
          boardId={thread.boardId}
          threadId={thread.id}
          lastSeq={currentLastSeq}
          aaMode={responseOptions.aaMode}
          username={username}
          defaultUsername={defaultUsername}
          tripcodeSalt={tripcodeSalt}
        />
      )}

      <ResponseForm onSubmit={handleSubmit}>
        <ResponseOptionButtons
          options={responseOptions}
          onToggle={toggleOption}
          isOverridden={isGlobalActive}
          hasThreadOverride={hasThreadOverride}
          onResetThreadOptions={resetAllThreadOptions}
          realtimeEnabled={realtimeEnabled}
        />
        <FormGroup style={{ marginBottom: "1.6rem" }}>
          <FormInput
            type="text"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={labels.usernamePlaceholder}
            spellCheck={false}
          />
        </FormGroup>
        <FormGroup style={{ marginBottom: "1.6rem" }}>
          <FormTextarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(applyShortcuts(e.target.value))}
            onKeyDown={handleKeyDown}
            placeholder={labels.contentPlaceholder}
            $aaMode={responseOptions.aaMode}
            spellCheck={false}
            required
          />
        </FormGroup>
        {storageEnabled && (
          <FormGroup style={{ marginBottom: "1.6rem" }}>
            <ImageUpload
              onFileSelect={setAttachmentFile}
              currentFile={attachmentFile}
              maxSizeLabel={maxSizeLabel}
              disabled={submitting}
              labels={{
                selectImage: labels.selectImage,
                removeImage: labels.removeImage,
              }}
            />
          </FormGroup>
        )}
        <SubmitButton
          type="submit"
          disabled={submitting || !content.trim()}
        >
          {submitting ? labels.submitting : labels.submit}
        </SubmitButton>
      </ResponseForm>
    </>
  );
}
