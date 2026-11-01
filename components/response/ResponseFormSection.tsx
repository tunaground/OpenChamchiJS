"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal, flushSync } from "react-dom";
import { signOutWithPush } from "@/lib/push/client";
import styled, { useTheme } from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowsRotate, faCompress, faExpand } from "@fortawesome/free-solid-svg-icons";
import { iconButtonCss } from "@/components/layout/iconButton";
import { ResponseOptionButtons, ResponsePreview } from "@/components/response";
import { ImageUpload } from "@/components/response/ImageUpload";
import { ImageAttachment } from "@/components/response/ImageAttachment";
import { useTranslations } from "next-intl";
import { formatBytes } from "@/lib/utils/format-bytes";
import { applyShortcuts } from "@/lib/utils/shortcuts";
import { getPageScroller, onPageScroll } from "@/lib/utils/page-scroll";
import type { ResponseOptions } from "@/lib/store/responseOptions";

const ResponseForm = styled.form``;

const IconButton = styled.button<{ $active?: boolean; $mobileOnly?: boolean }>`
  ${iconButtonCss}
  width: 3rem;
  height: 3rem;

  svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  ${(props) => props.$mobileOnly && "display: none;"}

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    display: flex;
  }
`;

/* The composer sits open after the responses. On mobile a button opens it
   over the whole screen: --vv-top/--vv-height follow the visual viewport, so
   it ends at the on-screen keyboard instead of under it */
const Inner = styled.div<{ $fullscreen: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;

  ${(props) => props.$fullscreen && `@media (max-width: ${props.theme.breakpoint}) {
    position: fixed;
    top: var(--vv-top, 0);
    left: 0;
    right: 0;
    height: var(--vv-height, 100dvh);
    z-index: 100;
    padding: 0.8rem 0.8rem calc(0.8rem + env(safe-area-inset-bottom));
    background: ${props.theme.pane};
    /* Opaque screen around the composer: Safari shows the page between the
       visual viewport and its keyboard accessory bar */
    box-shadow: 0 0 0 100vmax ${props.theme.pane};
    overscroll-behavior: contain;

    > * {
      flex-shrink: 0;
    }

    > :last-child {
      flex: 1 1 auto;
      min-height: 0;
    }
  }`}
`;

/** Options, name, body and submit framed together as one editor */
const Editor = styled.div`
  display: flex;
  flex-direction: column;
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

/* Name with refresh and fold at its right; its own line on mobile */
const NameRow = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  min-width: 18rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    flex-basis: 100%;
    border-top: 1px solid ${(props) => props.theme.line};
    padding-top: 0.4rem;
  }
`;

const NameInput = styled.input`
  flex: 1;
  min-width: 0;
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
    padding: 0 0.4rem;
  }
`;

const FormTextarea = styled.textarea<{ $aaMode?: boolean }>`
  /* Must not flex, or the column layout would override the height autoResize sets */
  flex: none;
  min-width: 0;
  min-height: 9.6rem;
  /* Grows with the text (AA works are often tall) up to nearly the whole pane */
  max-height: calc(100vh - 22rem);
  max-height: calc(100dvh - 22rem);
  padding: 1rem 1.2rem;
  border: none;
  /* Square between the head and foot rows, so the white AA paper fills its
     slot instead of floating as a rounded card */
  border-radius: 0;
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
    /* Fixed height that scrolls inside instead of growing; fills the
       composer when it is full screen */
    flex: 1 1 auto;
    height: 12rem;
    min-height: 0;
    max-height: none;

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

const EditorFoot = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 0.6rem 0.6rem 1rem;
  border-top: 1px solid ${(props) => props.theme.line};
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

/* Only in the full-screen mobile composer, where the responses are covered */
const PreviewArea = styled.div`
  flex-shrink: 0;
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
  color: ${(props) => props.theme.textSecondary};`;

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
  /** Where the next response will appear: the live preview renders there as that response */
  previewSlot?: HTMLElement | null;
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
  previewSlot,
}: ResponseFormSectionProps) {
  const [username, setUsername] = useState("");
  const [content, setContent] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // Mobile: the composer over the whole screen, until closed or posted
  const [fullscreen, setFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const isMobile = useCallback(
    () => window.matchMedia(`(max-width: ${theme.breakpoint})`).matches,
    [theme.breakpoint]
  );

  // Open synchronously, so the textarea is in place in time to be focused
  // within the tap (iOS only raises the keyboard for a focus inside a gesture)
  const openFullscreen = () => {
    flushSync(() => setFullscreen(true));
    textareaRef.current?.focus();
  };

  const closeFullscreen = () => {
    textareaRef.current?.blur();
    setFullscreen(false);
  };

  // When the on-screen keyboard opens, iOS scrolls only far enough to show the
  // caret, leaving the rest of the inline form (and the post button) under the
  // keyboard. Scroll the whole form into the visible area instead
  useEffect(() => {
    if (fullscreen) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      const form = formRef.current;
      if (!form || !form.contains(document.activeElement)) return;
      const overlap = form.getBoundingClientRect().bottom - (vv.offsetTop + vv.height);
      if (overlap > 0) window.scrollBy({ top: overlap, behavior: "instant" });
    };
    vv.addEventListener("resize", onResize);
    return () => vv.removeEventListener("resize", onResize);
  }, [fullscreen]);

  // The full-screen mobile composer follows the visual viewport (it shrinks
  // and shifts when the keyboard opens) and keeps the page behind it still
  useEffect(() => {
    if (!fullscreen || !isMobile()) return;
    const inner = innerRef.current;
    const vv = window.visualViewport;
    const update = () => {
      if (!inner || !vv) return;
      inner.style.setProperty("--vv-top", `${vv.offsetTop}px`);
      inner.style.setProperty("--vv-height", `${vv.height}px`);
    };
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      root.style.overflow = prevOverflow;
    };
  }, [fullscreen, isMobile]);

  // The chosen image, shown in the preview as it will be once posted
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!attachmentFile) {
      setAttachmentUrl(null);
      return;
    }
    const url = URL.createObjectURL(attachmentFile);
    setAttachmentUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [attachmentFile]);

  // The preview sits above the form, so as it grows while typing it would push
  // the form (and the caret) down. Keep the form where it was on screen
  useEffect(() => {
    const form = formRef.current;
    if (!previewSlot || !form) return;
    let lastTop = form.getBoundingClientRect().top;
    const remember = () => {
      lastTop = form.getBoundingClientRect().top;
    };
    const stopScroll = onPageScroll(remember);
    const observer = new ResizeObserver(() => {
      const shift = form.getBoundingClientRect().top - lastTop;
      if (shift !== 0 && form.contains(document.activeElement)) {
        (getPageScroller() ?? window).scrollBy({ top: shift, behavior: "instant" });
      }
      remember();
    });
    observer.observe(previewSlot);
    return () => {
      stopScroll();
      observer.disconnect();
    };
  }, [previewSlot]);

  const tThread = useTranslations("threadDetail");
  const maxSizeLabel = tThread("maxSize", { size: formatBytes(uploadMaxSize) });

  // Desktop only: on mobile the textarea keeps its height and scrolls inside
  const autoResize = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea || textarea.offsetParent === null) return;
    if (isMobile()) {
      textarea.style.height = "";
      return;
    }
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight + 4}px`;
    if (alwaysBottomRef.current && isAtBottomRef.current && pageEndRef.current) {
      pageEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [alwaysBottomRef, isAtBottomRef, pageEndRef, isMobile]);

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
      const finalContent = responseOptions.aaMode
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
        // Back to the responses to see the new one; the inline form stays
        if (fullscreen) closeFullscreen();
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

  const refreshIconButton = (
    <IconButton
      type="button"
      onClick={onRefresh}
      disabled={refreshing}
      title={labels.refresh}
      aria-label={labels.refresh}
    >
      <FontAwesomeIcon icon={faArrowsRotate} spin={refreshing} />
    </IconButton>
  );

  const optionButtons = (
    <ResponseOptionButtons
      options={responseOptions}
      onToggle={toggleOption}
      isOverridden={isGlobalActive}
      hasThreadOverride={hasThreadOverride}
      onResetThreadOptions={resetAllThreadOptions}
      realtimeEnabled={realtimeEnabled}
    />
  );

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

  const quickSubmitLabel =
    responseOptions.quickSubmitKey === "ctrl"
      ? "Ctrl+Enter"
      : responseOptions.quickSubmitKey === "shift"
        ? "Shift+Enter"
        : null;

  const preview = responseOptions.previewMode ? (
    <ResponsePreview
      content={content}
      boardId={thread.boardId}
      threadId={thread.id}
      lastSeq={currentLastSeq}
      aaMode={responseOptions.aaMode}
      username={username}
      defaultUsername={defaultUsername}
      tripcodeSalt={tripcodeSalt}
      attachment={attachmentUrl}
      attachmentRenderer={(src) => <ImageAttachment src={src} />}
    />
  ) : null;

  return (
    <ResponseForm ref={formRef} onSubmit={handleSubmit}>
      {preview && previewSlot && !fullscreen && createPortal(preview, previewSlot)}
      <Inner ref={innerRef} $fullscreen={fullscreen}>
      {preview && (!previewSlot || fullscreen) && <PreviewArea>{preview}</PreviewArea>}
      <Editor>
        <EditorHead>
          {optionButtons}
          <HeadDivider />
          <NameRow>
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
            {refreshIconButton}
            <IconButton
              type="button"
              $mobileOnly
              onClick={fullscreen ? closeFullscreen : openFullscreen}
              title={tThread(fullscreen ? "exitFullscreen" : "fullscreen")}
              aria-label={tThread(fullscreen ? "exitFullscreen" : "fullscreen")}
            >
              <FontAwesomeIcon icon={fullscreen ? faCompress : faExpand} />
            </IconButton>
          </NameRow>
        </EditorHead>
        <FormTextarea
          data-draft
          ref={textareaRef}
          rows={1}
          value={content}
          onChange={(e) => setContent(applyShortcuts(e.target.value))}
          onKeyDown={handleKeyDown}
          placeholder={labels.contentPlaceholder}
          $aaMode={responseOptions.aaMode}
          spellCheck={false}
          required
        />
        <EditorFoot>
          {storageEnabled && (
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
          {quickSubmitLabel && (
            <Hint>{tThread("quickSubmitHint", { key: quickSubmitLabel })}</Hint>
          )}
          <SubmitButton type="submit" disabled={submitting || !content.trim()}>
            {submitting ? labels.submitting : labels.submit}
          </SubmitButton>
        </EditorFoot>
      </Editor>
      </Inner>
    </ResponseForm>
  );
}
