"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { signOutWithPush } from "@/lib/push/client";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate } from "@fortawesome/free-solid-svg-icons";
import { ResponseOptionButtons, ResponsePreview } from "@/components/response";
import { ImageUpload } from "@/components/response/ImageUpload";
import { useTranslations } from "next-intl";
import { formatBytes } from "@/lib/utils/format-bytes";
import { applyShortcuts } from "@/lib/utils/shortcuts";
import type { ResponseOptions } from "@/lib/store/responseOptions";

const ResponseForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

/** Options, name, body and submit framed together as one editor */
const Editor = styled.div<{ $open: boolean }>`
  display: flex;
  flex-direction: ${(props) => (props.$open ? "column" : "row")};
  align-items: ${(props) => (props.$open ? "stretch" : "center")};
  border: 1px solid ${(props) => props.theme.line};
  border-radius: ${(props) => props.theme.radiusPane};
  background: ${(props) => props.theme.paneSunken};
  transition: border-color 0.15s;

  &:focus-within {
    border-color: ${(props) => props.theme.accent};
  }
`;

const EditorHead = styled.div`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.4rem 0.6rem;
  border-bottom: 1px solid ${(props) => props.theme.line};

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    flex-wrap: wrap;
  }
`;

const HeadDivider = styled.span`
  width: 1px;
  height: 1.8rem;
  background: ${(props) => props.theme.lineStrong};

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

const NameInput = styled.input`
  flex: 1;
  min-width: 12rem;
  height: 3rem;
  padding: 0 0.6rem;
  border: none;
  border-radius: ${(props) => props.theme.radiusControl};
  background: transparent;
  font-size: 1.4rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};

  &:hover {
    background: ${(props) => props.theme.hover};
  }

  &:focus {
    outline: none;
    background: ${(props) => props.theme.hover};
  }

  &::placeholder {
    color: ${(props) => props.theme.textMuted};
    font-weight: 400;
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    flex-basis: 100%;
    border-top: 1px solid ${(props) => props.theme.line};
    border-radius: 0;
    padding: 0 0.4rem;
  }
`;

const FormTextarea = styled.textarea<{ $aaMode?: boolean; $open: boolean }>`
  /* Collapsed it fills the row's width; expanded it must not flex, or the
     column layout would override the height autoResize sets */
  flex: ${(props) => (props.$open ? "none" : "1")};
  min-width: 0;
  min-height: ${(props) => (props.$open ? "9.6rem" : "3.6rem")};
  /* Grows with the text (AA works are often tall) up to nearly the whole pane */
  max-height: calc(100vh - 22rem);
  max-height: calc(100dvh - 22rem);
  padding: ${(props) => (props.$open ? "1rem 1.2rem" : "0.7rem 1.2rem")};
  border: none;
  /* Expanded it sits square between the head and foot rows; folded it only
     rounds the left edge, inset by the editor's 1px border. So the white AA
     paper fills its slot instead of floating as a rounded card */
  border-radius: ${(props) =>
    props.$open ? "0" : `calc(${props.theme.radiusPane} - 1px) 0 0 calc(${props.theme.radiusPane} - 1px)`};
  font-size: 1.5rem;
  background: ${(props) => (props.$aaMode ? "rgba(255, 255, 255)" : "transparent")};
  color: ${(props) => (props.$aaMode ? "black" : props.theme.textPrimary)};
  resize: none;
  font-family: ${(props) => (props.$aaMode ? props.theme.fontAA : "inherit")};
  line-height: ${(props) => (props.$aaMode ? "1.6rem" : "1.5")};
  white-space: ${(props) => (props.$aaMode ? "pre" : "pre-wrap")};
  overflow-x: ${(props) => (props.$aaMode ? "auto" : "hidden")};
  overflow-y: auto;

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

const EditorFoot = styled.div<{ $open: boolean }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: ${(props) => (props.$open ? "0.6rem 0.6rem 0.6rem 1rem" : "0 0.5rem 0 0")};
  border-top: ${(props) => (props.$open ? `1px solid ${props.theme.line}` : "none")};
  flex-wrap: wrap;
`;

const Hint = styled.span`
  font-size: 1.2rem;
  color: ${(props) => props.theme.textMuted};

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: none;
  }
`;

const SubmitButton = styled.button`
  flex-shrink: 0;
  height: 3rem;
  margin-left: auto;
  padding: 0 1.6rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: ${(props) => props.theme.radiusControl};
  font-size: 1.4rem;
  font-weight: 500;
  cursor: pointer;

  &:hover {
    filter: brightness(1.06);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const PreviewArea = styled.div`
  max-height: 30vh;
  overflow-y: auto;
  padding: 0 1rem;
  border: 1px dashed ${(props) => props.theme.lineStrong};
  border-radius: ${(props) => props.theme.radiusPane};
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  height: 3.2rem;
  padding: 0 1.2rem;
  border: 1px solid ${(props) => props.theme.lineStrong};
  border-radius: ${(props) => props.theme.radiusControl};
  background: transparent;
  color: ${(props) => props.theme.textPrimary};
  font-size: 1.3rem;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: ${(props) => props.theme.hover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const EndedNotice = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1.2rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
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
  refresh: string;
  refreshing: string;
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
  onRefresh: () => void;
  refreshing: boolean;
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
  onRefresh,
  refreshing,
}: ResponseFormSectionProps) {
  const [username, setUsername] = useState("");
  const [content, setContent] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // The dock stays one line until the user starts writing
  const [focused, setFocused] = useState(false);
  const open = focused || !!content || !!attachmentFile;

  // Fold the empty form when the user clicks anywhere else on the page
  useEffect(() => {
    if (!focused) return;
    const onPointerDown = (e: PointerEvent) => {
      if (formRef.current?.contains(e.target as Node)) return;
      if (!content && !attachmentFile) setFocused(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [focused, content, attachmentFile]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  // Re-measure on open/fold too: the two states have different minimum heights
  useEffect(() => {
    autoResize();
  }, [content, open, autoResize]);

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
            await signOutWithPush({ redirect: true, callbackUrl: "/" });
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

  const refreshButton = (
    <RefreshButton
      type="button"
      onClick={onRefresh}
      disabled={refreshing}
      title={labels.refresh}
      aria-label={labels.refresh}
    >
      <FontAwesomeIcon icon={faArrowsRotate} spin={refreshing} />
      <span>{refreshing ? labels.refreshing : labels.refresh}</span>
    </RefreshButton>
  );

  if (thread.ended) {
    return (
      <EndedNotice>
        <span>{labels.threadEnded}</span>
        {refreshButton}
      </EndedNotice>
    );
  }

  // Folding back happens only on a click outside (or Esc), never because a
  // button inside took focus: Safari doesn't focus buttons on click
  const isBlank = !content && !attachmentFile;
  const handleFocusOut = (e: React.FocusEvent<HTMLFormElement>) => {
    const next = e.relatedTarget as Node | null;
    if (next && !e.currentTarget.contains(next) && isBlank) setFocused(false);
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape" && isBlank) {
      setFocused(false);
      e.currentTarget.blur();
      return;
    }
    handleKeyDown(e);
  };

  const quickSubmitLabel =
    responseOptions.quickSubmitKey === "ctrl"
      ? "Ctrl+Enter"
      : responseOptions.quickSubmitKey === "shift"
        ? "Shift+Enter"
        : null;

  return (
    <ResponseForm
      ref={formRef}
      onSubmit={handleSubmit}
      onFocus={() => setFocused(true)}
      onBlur={handleFocusOut}
    >
      {open && responseOptions.previewMode && (
        <PreviewArea>
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
        </PreviewArea>
      )}
      <Editor $open={open}>
        {open && (
          <EditorHead>
            <ResponseOptionButtons
              options={responseOptions}
              onToggle={toggleOption}
              isOverridden={isGlobalActive}
              hasThreadOverride={hasThreadOverride}
              onResetThreadOptions={resetAllThreadOptions}
              realtimeEnabled={realtimeEnabled}
            />
            <HeadDivider />
            <NameInput
              type="text"
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={labels.usernamePlaceholder}
              aria-label={labels.usernamePlaceholder}
              spellCheck={false}
            />
          </EditorHead>
        )}
        <FormTextarea
          data-draft
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={(e) => setContent(applyShortcuts(e.target.value))}
          onKeyDown={handleTextareaKeyDown}
          placeholder={labels.contentPlaceholder}
          $aaMode={responseOptions.aaMode}
          $open={open}
          spellCheck={false}
          required
        />
        <EditorFoot $open={open}>
          {open && storageEnabled && (
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
          )}
          {open && quickSubmitLabel && (
            <Hint>{tThread("quickSubmitHint", { key: quickSubmitLabel })}</Hint>
          )}
          <SubmitButton type="submit" disabled={submitting || !content.trim()}>
            {submitting ? labels.submitting : labels.submit}
          </SubmitButton>
        </EditorFoot>
      </Editor>
    </ResponseForm>
  );
}
