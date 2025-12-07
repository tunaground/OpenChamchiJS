"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { PageLayout } from "@/components/layout";
import { TraceSidebar } from "@/components/sidebar/TraceSidebar";
import { ResponseOptionButtons, ResponsePreview } from "@/components/response";
import { ImageUpload } from "@/components/response/ImageUpload";
import { ImageAttachment } from "@/components/response/ImageAttachment";
import { useResponseOptions } from "@/lib/hooks/useResponseOptions";
import { useChatMode } from "@/lib/hooks/useChatMode";
import { usePresence } from "@/lib/hooks/usePresence";
import { CHANNELS } from "@/lib/realtime";
import { useTranslations } from "next-intl";
import { parse, prerender, render, toOriginalFormat, type PrerenderedRoot, type AnchorInfo } from "@/lib/tom";
import { useToast } from "@/components/Toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import { formatDateTime } from "@/lib/utils/date-formatter";
import { formatBytes } from "@/lib/utils/format-bytes";

const Container = styled.div`
  padding: 3.2rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.6rem;
  }
`;


const ThreadHeader = styled.div`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 2.4rem;
  margin-bottom: 2.4rem;
`;

const ThreadTitle = styled.h1`
  font-size: 2.4rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin: 0 0 1.6rem 0;
`;

const BadgeContainer = styled.div`
  display: flex;
  gap: 0.8rem;
  margin-bottom: 1.6rem;
`;

const Badge = styled.span<{ $variant?: "top" | "ended" }>`
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 1.2rem;
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
  flex-direction: column;
  gap: 0.4rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
`;

const MetaItem = styled.div`
  display: flex;
  gap: 0.8rem;
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
  gap: 1.6rem;
`;

const AnchorPreviewSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
  margin-bottom: 2.4rem;
  padding: 1.6rem;
  background: ${(props) => props.theme.surfaceHover};
  border: 2px solid ${(props) => props.theme.anchorALinkColor || props.theme.textSecondary};
  border-radius: 8px;
`;

const AnchorPreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
`;

const AnchorPreviewTitle = styled.span`
  font-size: 1.4rem;
  font-weight: 500;
  color: ${(props) => props.theme.textSecondary};
`;

const AnchorCloseButton = styled.button`
  padding: 0.4rem 0.8rem;
  background: transparent;
  color: ${(props) => props.theme.textSecondary};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.2rem;
  cursor: pointer;

  &:hover {
    background: ${(props) => props.theme.surface};
  }
`;

const AnchorResponseCard = styled.div`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 6px;
  overflow: hidden;
`;

const ResponseCard = styled.div`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  overflow: hidden;
`;

const ResponseHeader = styled.div`
  padding: 1.2rem 1.6rem;
  background: ${(props) => props.theme.surfaceHover};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const ResponseInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  font-size: 1.4rem;
  flex-wrap: wrap;
  flex: 1;
  min-width: 0;
`;

const ResponseSeq = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-weight: 500;
`;

const ResponseUsername = styled.span`
  color: ${(props) => props.theme.textPrimary};
  font-weight: 500;
  word-break: break-all;
`;

const ResponseAuthorId = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-size: 1.2rem;
`;

const ResponseDate = styled.span`
  color: ${(props) => props.theme.textSecondary};
  font-size: 1.2rem;
  margin-left: auto;
`;

const RawContentButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.4rem;
  height: 2.4rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 0.4rem;
  background: ${(props) =>
    props.$active ? props.theme.buttonPrimary : "transparent"};
  color: ${(props) =>
    props.$active ? props.theme.buttonPrimaryText : props.theme.textSecondary};
  cursor: pointer;
  transition: all 0.15s ease;
  margin-left: 0.8rem;

  &:hover {
    background: ${(props) =>
      props.$active ? props.theme.buttonPrimary : props.theme.surfaceHover};
    opacity: ${(props) => (props.$active ? 0.9 : 1)};
  }
`;

const ResponseContent = styled.div`
  padding: 1.6rem;
  font-size: 1.5rem;
  line-height: 1.6;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-word;

  /* TOM styles */
  hr {
    border: none;
    border-top: 1px solid ${(props) => props.theme.surfaceBorder};
    margin: 1.6rem 0;
  }
`;

const RawContentDisplay = styled.span`
  white-space: pre-wrap;
`;

const ResponseAttachment = styled.div`
  padding: 1.6rem 1.6rem 0;
`;

const AttachmentLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.8rem 1.2rem;
  background: ${(props) => props.theme.surfaceHover};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  color: ${(props) => props.theme.textPrimary};
  text-decoration: none;
  font-size: 1.4rem;

  &:hover {
    background: ${(props) => props.theme.surface};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4.8rem;
  color: ${(props) => props.theme.textSecondary};
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
`;

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

const FormTextarea = styled.textarea`
  width: 100%;
  min-height: 12rem;
  padding: 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
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

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: ${(props) => props.theme.surface};
  border-radius: 8px;
  padding: 2.4rem;
  max-width: 40rem;
  width: 90%;
`;

const ModalTitle = styled.h2`
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0 0 1.6rem 0;
  color: ${(props) => props.theme.textPrimary};
`;

const ModalDescription = styled.p`
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  margin: 0 0 1.6rem 0;
`;

const ModalInput = styled.input`
  width: 100%;
  padding: 1rem 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 1.6rem;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1.2rem;
  justify-content: flex-end;
`;

const ModalButton = styled.button`
  height: 3.5rem;
  padding: 0 1.6rem;
  border-radius: 4px;
  font-size: 1.4rem;
  font-weight: 500;
  cursor: pointer;
`;

const CancelButton = styled(ModalButton)`
  background: transparent;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  color: ${(props) => props.theme.textPrimary};

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }
`;

const ConfirmButton = styled(ModalButton)`
  background: ${(props) => props.theme.error};
  border: none;
  color: white;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  font-size: 1.3rem;
  color: ${(props) => props.theme.error};
  margin: -0.8rem 0 1.6rem 0;
`;

const ManageModalContent = styled(ModalContent)`
  max-width: 50rem;
  max-height: 90vh;
  overflow-y: auto;
`;

const ManageResponseCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 60vh;
  overflow-y: auto;
`;

const ManageResponseCard = styled.div`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 1.2rem;
`;

const ManageResponseCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
`;

const ManageResponseCardContent = styled.div`
  font-size: 1.3rem;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 0.8rem;
  word-break: break-word;
  white-space: pre-wrap;
  max-height: 8rem;
  overflow: hidden;
`;

const ManageResponseCardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-items: center;
`;

const StatusBadge = styled.span<{ $visible: boolean }>`
  display: inline-block;
  padding: 0.2rem 0.8rem;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 500;
  background: ${(props) => props.$visible ? "#22c55e" : "#f59e0b"};
  color: white;
`;

const ActionButton = styled.button`
  padding: 0.4rem 0.8rem;
  background: transparent;
  color: ${(props) => props.theme.textPrimary};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.2rem;
  cursor: pointer;

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const UnlockSection = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const UnlockInput = styled(ModalInput)`
  margin-bottom: 0;
  flex: 1;
`;

const UnlockButton = styled(ConfirmButton)`
  background: ${(props) => props.theme.buttonPrimary};
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
  deleteResponse: string;
  deleteModalTitle: string;
  deleteModalDescription: string;
  passwordPlaceholder: string;
  cancel: string;
  confirm: string;
  invalidPassword: string;
  manageResponses: string;
  manageModalTitle: string;
  manageModalDescription: string;
  seq: string;
  content: string;
  status: string;
  actions: string;
  visible: string;
  hidden: string;
  restore: string;
  hide: string;
  noHiddenResponses: string;
  close: string;
  unlock: string;
  foreignIpBlocked: string;
  unknownError: string;
  selectImage: string;
  removeImage: string;
  viewSource: string;
  copied: string;
}

interface AuthLabels {
  login: string;
  logout: string;
}

interface SidebarLabels {
  navigation: string;
  backToBoard: string;
  manageThread: string;
  viewAll: string;
  viewRecent: string;
  prev: string;
  next: string;
  scrollUp: string;
  scrollDown: string;
  boards: string;
}

interface ThreadDetailContentProps {
  thread: ThreadData;
  boards: { id: string; name: string }[];
  defaultUsername: string;
  showUserCount: boolean;
  realtimeEnabled: boolean;
  storageEnabled: boolean;
  uploadMaxSize: number;
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
  showUserCount,
  realtimeEnabled,
  storageEnabled,
  uploadMaxSize,
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
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pageEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const { showToast } = useToast();

  // Response options
  const {
    options: responseOptions,
    toggleOption,
    isGlobalActive,
    hasThreadOverride,
    resetAllThreadOptions,
  } = useResponseOptions(thread.boardId, thread.id);

  // Track the current last seq for chat mode
  const currentLastSeq = useMemo(() => {
    if (responses.length === 0) return lastSeq;
    return Math.max(lastSeq, ...responses.map((r) => r.seq));
  }, [responses, lastSeq]);

  // Chat mode: handle new responses from realtime
  const handleNewResponse = useCallback((newResponse: ResponseData) => {
    setResponses((prev) => {
      // Avoid duplicates
      if (prev.some((r) => r.id === newResponse.id)) {
        return prev;
      }
      return [...prev, newResponse];
    });
  }, []);

  // Chat mode hook
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { isConnected: _isChatConnected, error: _chatError } = useChatMode(
    responseOptions.chatMode,
    thread.boardId,
    thread.id,
    currentLastSeq,
    handleNewResponse
  );

  // Presence tracking for user counter (thread level for /trace page)
  // Only enabled if board.showUserCount is true
  const threadChannel = CHANNELS.thread(thread.id);
  const { memberCount: threadMemberCount } = usePresence(threadChannel, showUserCount);

  // Anchor preview stack state
  interface AnchorStackItem {
    info: AnchorInfo;
    responses: ResponseData[];
    loading: boolean;
  }
  const [anchorStack, setAnchorStack] = useState<AnchorStackItem[]>([]);

  // Raw content toggle state
  const [rawContentIds, setRawContentIds] = useState<Set<string>>(new Set());

  const toggleRawContent = useCallback((id: string) => {
    setRawContentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Handle anchor click - push to stack
  const handleAnchorClick = (info: AnchorInfo) => {
    setAnchorStack((prev) => [...prev, { info, responses: [], loading: true }]);
  };

  // Close specific anchor preview
  const closeAnchorPreview = (sourceResponseId: string) => {
    setAnchorStack((prev) => {
      const index = prev.findIndex((item) => item.info.sourceResponseId === sourceResponseId);
      if (index !== -1) {
        // Remove this item and all items after it
        return prev.slice(0, index);
      }
      return prev;
    });
  };

  // Manage modal state
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [managePassword, setManagePassword] = useState("");
  const [manageUnlocked, setManageUnlocked] = useState(false);
  const [manageError, setManageError] = useState("");
  const [allResponses, setAllResponses] = useState<(ResponseData & { visible: boolean })[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedResponseIds, setSelectedResponseIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    setResponses(initialResponses);
  }, [initialResponses]);

  // Track scroll position to detect if user is at bottom
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      // Consider "at bottom" if within 100px of the bottom
      isAtBottomRef.current = scrollTop + windowHeight >= documentHeight - 100;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial position
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Always-on-Bottom mode: scroll to bottom only when user is already at bottom
  useEffect(() => {
    if (responseOptions.alwaysBottom && pageEndRef.current && isAtBottomRef.current) {
      // In chat mode, use instant scroll to prevent jitter
      // Otherwise, use smooth scroll for better UX
      const behavior = responseOptions.chatMode ? "instant" : "smooth";
      pageEndRef.current.scrollIntoView({ behavior });
    }
  }, [responseOptions.alwaysBottom, responseOptions.chatMode, responses]);

  // Fetch anchor responses when a new item is added to the stack
  useEffect(() => {
    const lastItem = anchorStack[anchorStack.length - 1];
    if (!lastItem || !lastItem.loading) return;

    const fetchAnchorResponses = async () => {
      try {
        const { boardId: anchorBoardId, threadId: anchorThreadId, start, end } = lastItem.info;
        const endSeq = end ?? start;
        const res = await fetch(
          `/api/boards/${anchorBoardId}/threads/${anchorThreadId}/responses?startSeq=${start}&endSeq=${endSeq}`
        );
        if (res.ok) {
          const data = await res.json();
          setAnchorStack((prev) => {
            const newStack = [...prev];
            const idx = newStack.findIndex((item) => item.info.sourceResponseId === lastItem.info.sourceResponseId);
            if (idx !== -1) {
              newStack[idx] = { ...newStack[idx], responses: data, loading: false };
            }
            return newStack;
          });
        }
      } catch {
        console.error("Failed to fetch anchor responses");
        setAnchorStack((prev) => {
          const newStack = [...prev];
          const idx = newStack.findIndex((item) => item.info.sourceResponseId === lastItem.info.sourceResponseId);
          if (idx !== -1) {
            newStack[idx] = { ...newStack[idx], loading: false };
          }
          return newStack;
        });
      }
    };

    fetchAnchorResponses();
  }, [anchorStack.length]);

  // Prerender TOM content for all responses
  const prerenderedContents = useMemo(() => {
    const map = new Map<string, PrerenderedRoot>();
    for (const response of responses) {
      const parsed = parse(response.content);
      const prerendered = prerender(parsed);
      map.set(response.id, prerendered);
    }
    return map;
  }, [responses]);

  // Prerender TOM content for all anchor stack responses
  const anchorPrerenderedContents = useMemo(() => {
    const map = new Map<string, PrerenderedRoot>();
    for (const stackItem of anchorStack) {
      for (const response of stackItem.responses) {
        if (!map.has(response.id)) {
          const parsed = parse(response.content);
          const prerendered = prerender(parsed);
          map.set(response.id, prerendered);
        }
      }
    }
    return map;
  }, [anchorStack]);

  const t = useTranslations();
  const tThread = useTranslations("threadDetail");

  const maxSizeLabel = tThread("maxSize", { size: formatBytes(uploadMaxSize) });

  const getErrorMessage = (data: { error: string | object }): string => {
    if (typeof data.error === "string") {
      if (data.error === "FOREIGN_IP_BLOCKED") {
        return labels.foreignIpBlocked;
      }
      return data.error;
    }
    return labels.unknownError;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);

    try {
      // Apply AA mode: wrap content with [aa][/aa] tags
      let finalContent = content.trim();
      if (responseOptions.aaMode) {
        finalContent = `[aa]${finalContent}[/aa]`;
      }

      // Use FormData if there's a file, otherwise use JSON
      let res: Response;
      if (attachmentFile) {
        const formData = new FormData();
        formData.append("file", attachmentFile);
        formData.append("content", finalContent);
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
          }),
        });
      }

      if (res.ok) {
        setContent("");
        setAttachmentFile(null);
        // In chat mode, the response will arrive via WebSocket
        // Otherwise, refresh the page to fetch the new response
        if (!responseOptions.chatMode) {
          router.refresh();
        }
      } else {
        let errorMessage = labels.unknownError;
        try {
          const data = await res.json();
          console.error("Failed to create response:", data);
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

  // Quick submit handler for keyboard shortcut
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

  // Render anchor stack recursively for a given source key
  // sourceKey format: "main:{responseId}" for main responses, "anchor:{parentSourceKey}:{responseId}" for nested
  const renderAnchorStack = (sourceKey: string): React.ReactNode => {
    // Find the anchor stack item that has this sourceKey as sourceResponseId
    const stackItem = anchorStack.find((item) => item.info.sourceResponseId === sourceKey);
    if (!stackItem) return null;

    const { info, responses: anchorResponses, loading } = stackItem;

    return (
      <AnchorPreviewSection key={`anchor-${sourceKey}`}>
        <AnchorPreviewHeader>
          <AnchorPreviewTitle>
            &gt;{info.threadId}&gt;{info.start}
            {info.end && info.end !== info.start && `-${info.end}`}
          </AnchorPreviewTitle>
          <AnchorCloseButton onClick={() => closeAnchorPreview(sourceKey)}>
            {labels.close}
          </AnchorCloseButton>
        </AnchorPreviewHeader>
        {loading ? (
          <div style={{ textAlign: "center", padding: "1rem", color: "var(--text-secondary)" }}>
            Loading...
          </div>
        ) : (
          anchorResponses.filter((r) => r.seq !== 0).map((anchorResponse) => {
            // Create unique key for nested anchor responses
            const nestedKey = `anchor:${sourceKey}:${anchorResponse.id}`;
            return (
              <div key={anchorResponse.id}>
                {/* Recursively render nested anchor previews */}
                {renderAnchorStack(nestedKey)}
                <AnchorResponseCard>
                  <ResponseHeader>
                    <ResponseInfo>
                      <ResponseSeq>#{anchorResponse.seq}</ResponseSeq>
                      <ResponseUsername>{anchorResponse.username}</ResponseUsername>
                      <ResponseAuthorId>({anchorResponse.authorId})</ResponseAuthorId>
                      <ResponseDate>{formatDateTime(anchorResponse.createdAt)}</ResponseDate>
                    </ResponseInfo>
                  </ResponseHeader>
                  <ResponseContent>
                    {anchorPrerenderedContents.has(anchorResponse.id)
                      ? render(anchorPrerenderedContents.get(anchorResponse.id)!, {
                          boardId: info.boardId,
                          threadId: info.threadId,
                          responseId: nestedKey,
                          setAnchorInfo: handleAnchorClick,
                          t,
                          onCopy: () => showToast(labels.copied),
                        })
                      : anchorResponse.content}
                  </ResponseContent>
                </AnchorResponseCard>
              </div>
            );
          })
        )}
      </AnchorPreviewSection>
    );
  };

  // Manage modal handlers
  const openManageModal = () => {
    setManageModalOpen(true);
    setManagePassword("");
    setManageUnlocked(false);
    setManageError("");
    setAllResponses([]);
  };

  const closeManageModal = () => {
    setManageModalOpen(false);
    setManagePassword("");
    setManageUnlocked(false);
    setManageError("");
    setAllResponses([]);
    setSelectedResponseIds(new Set());
    setLastSelectedIndex(null);
  };

  const unlockManage = async () => {
    if (!managePassword.trim()) return;

    setLoadingResponses(true);
    setManageError("");

    try {
      const res = await fetch(
        `/api/boards/${thread.boardId}/threads/${thread.id}/responses?includeHidden=true&limit=10000`,
        {
          headers: {
            "X-Thread-Password": managePassword,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        // Filter out seq 0 (thread body) - it cannot be modified via this modal
        setAllResponses(data.filter((r: ResponseData & { visible: boolean }) => r.seq !== 0));
        setManageUnlocked(true);
      } else {
        setManageError(labels.invalidPassword);
      }
    } catch {
      setManageError("Network error");
    } finally {
      setLoadingResponses(false);
    }
  };

  const toggleVisibility = async (responseId: string, currentVisible: boolean) => {
    setTogglingId(responseId);

    try {
      const res = await fetch(
        `/api/boards/${thread.boardId}/threads/${thread.id}/responses/${responseId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: managePassword,
            visible: !currentVisible,
          }),
        }
      );

      if (res.ok) {
        // Update local state
        setAllResponses((prev) =>
          prev.map((r) =>
            r.id === responseId ? { ...r, visible: !currentVisible } : r
          )
        );
        // Refresh the page to update main view
        router.refresh();
      }
    } finally {
      setTogglingId(null);
    }
  };

  const handleResponseCheckboxClick = (index: number, e: React.MouseEvent<HTMLInputElement>) => {
    const id = allResponses[index].id;
    const newSet = new Set(selectedResponseIds);

    if (e.shiftKey && lastSelectedIndex !== null) {
      // Shift+click: select range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      for (let i = start; i <= end; i++) {
        newSet.add(allResponses[i].id);
      }
    } else {
      // Normal click: toggle single item
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      setLastSelectedIndex(index);
    }

    setSelectedResponseIds(newSet);
  };

  const toggleAllResponses = () => {
    if (selectedResponseIds.size === allResponses.length) {
      setSelectedResponseIds(new Set());
    } else {
      setSelectedResponseIds(new Set(allResponses.map((r) => r.id)));
    }
    setLastSelectedIndex(null);
  };

  const handleBulkHide = async () => {
    if (selectedResponseIds.size === 0) return;
    setBulkDeleting(true);
    try {
      const hidePromises = Array.from(selectedResponseIds).map((id) =>
        fetch(
          `/api/boards/${thread.boardId}/threads/${thread.id}/responses/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              password: managePassword,
              visible: false,
            }),
          }
        )
      );
      await Promise.all(hidePromises);

      // Update local state
      setAllResponses((prev) =>
        prev.map((r) =>
          selectedResponseIds.has(r.id) ? { ...r, visible: false } : r
        )
      );
      setSelectedResponseIds(new Set());
      router.refresh();
    } finally {
      setBulkDeleting(false);
    }
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
      onManageClick={openManageModal}
    />
  );

  return (
    <PageLayout
      title={thread.title}
      sidebar={sidebar}
      compactSidebarOnMobile
      isLoggedIn={isLoggedIn}
      canAccessAdmin={canAccessAdmin}
      authLabels={authLabels}
      userCount={showUserCount ? threadMemberCount : undefined}
    >
      <Container>
        <ThreadHeader>
          <ThreadTitle>
            &gt;{thread.id}&gt; {thread.title} ({lastSeq})
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
              <MetaLabel>{labels.createdAt}:</MetaLabel>
              <MetaValue>{formatDateTime(thread.createdAt)}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>{labels.updatedAt}:</MetaLabel>
              <MetaValue>{formatDateTime(thread.updatedAt)}</MetaValue>
            </MetaItem>
          </ThreadMeta>
        </ThreadHeader>

        <ResponsesSection>
        {responses.length === 0 ? (
          <EmptyState>{labels.noResponses}</EmptyState>
        ) : (
          responses.map((response) => {
            // Create unique key for main responses
            const mainKey = `main:${response.id}`;
            return (
            <div key={response.id}>
              {/* Anchor Preview Stack - shown above the source response */}
              {renderAnchorStack(mainKey)}
              <ResponseCard>
                <ResponseHeader>
                  <ResponseInfo>
                    <ResponseSeq>#{response.seq}</ResponseSeq>
                    <ResponseUsername>{response.username}</ResponseUsername>
                    <ResponseAuthorId>({response.authorId})</ResponseAuthorId>
                    <ResponseDate>{formatDateTime(response.createdAt)}</ResponseDate>
                    <RawContentButton
                      $active={rawContentIds.has(response.id)}
                      onClick={() => toggleRawContent(response.id)}
                      title={labels.viewSource}
                    >
                      <FontAwesomeIcon icon={faCode} />
                    </RawContentButton>
                  </ResponseInfo>
                </ResponseHeader>
                {response.attachment && (
                  <ResponseAttachment>
                    {response.attachment.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                    response.attachment.includes("/storage/") ? (
                      <ImageAttachment src={response.attachment} />
                    ) : (
                      <AttachmentLink
                        href={response.attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        📎 Attachment
                      </AttachmentLink>
                    )}
                  </ResponseAttachment>
                )}
                <ResponseContent>
                  {rawContentIds.has(response.id) ? (
                    <RawContentDisplay>
                      {toOriginalFormat(response.content)}
                    </RawContentDisplay>
                  ) : prerenderedContents.has(response.id) ? (
                    render(prerenderedContents.get(response.id)!, {
                      boardId: thread.boardId,
                      threadId: thread.id,
                      responseId: mainKey,
                      setAnchorInfo: handleAnchorClick,
                      t,
                      onCopy: () => showToast(labels.copied),
                    })
                  ) : (
                    response.content
                  )}
                </ResponseContent>
              </ResponseCard>
            </div>
            );
          })
        )}
      </ResponsesSection>

      {thread.ended ? (
        <EndedNotice>{labels.threadEnded}</EndedNotice>
      ) : (
        <ResponseForm onSubmit={handleSubmit}>
          <ResponseOptionButtons
            options={responseOptions}
            onToggle={toggleOption}
            isOverridden={isGlobalActive}
            hasThreadOverride={hasThreadOverride}
            onResetThreadOptions={resetAllThreadOptions}
            realtimeEnabled={realtimeEnabled}
          />
          {responseOptions.previewMode && (
            <ResponsePreview
              content={content}
              boardId={thread.boardId}
              threadId={thread.id}
            />
          )}
          <FormGroup style={{ marginBottom: "1.6rem" }}>
            <FormInput
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={labels.usernamePlaceholder}
            />
          </FormGroup>
          <FormGroup style={{ marginBottom: "1.6rem" }}>
            <FormTextarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={labels.contentPlaceholder}
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
      )}
      <div ref={pageEndRef} />
      </Container>

      {/* Manage Responses Modal */}
      {manageModalOpen && (
        <Modal onClick={closeManageModal}>
          <ManageModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{labels.manageModalTitle}</ModalTitle>

            {!manageUnlocked ? (
              <>
                <ModalDescription>{labels.manageModalDescription}</ModalDescription>
                <UnlockSection>
                  <UnlockInput
                    type="password"
                    value={managePassword}
                    onChange={(e) => setManagePassword(e.target.value)}
                    placeholder={labels.passwordPlaceholder}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && managePassword.trim()) {
                        unlockManage();
                      }
                    }}
                  />
                  <UnlockButton
                    onClick={unlockManage}
                    disabled={loadingResponses || !managePassword.trim()}
                  >
                    {labels.unlock}
                  </UnlockButton>
                </UnlockSection>
                {manageError && <ErrorMessage style={{ marginTop: "1rem" }}>{manageError}</ErrorMessage>}
              </>
            ) : (
              <>
                {allResponses.length === 0 ? (
                  <ModalDescription>{labels.noHiddenResponses}</ModalDescription>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.6rem" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={selectedResponseIds.size === allResponses.length && allResponses.length > 0}
                          onChange={toggleAllResponses}
                          style={{ width: "1.6rem", height: "1.6rem" }}
                        />
                        <span style={{ fontSize: "1.2rem" }}>전체 선택</span>
                      </label>
                      {selectedResponseIds.size > 0 && (
                        <ConfirmButton onClick={handleBulkHide} disabled={bulkDeleting}>
                          {labels.hide} ({selectedResponseIds.size})
                        </ConfirmButton>
                      )}
                    </div>
                    <ManageResponseCards>
                      {allResponses.map((response, index) => (
                        <ManageResponseCard key={response.id}>
                          <ManageResponseCardHeader>
                            <input
                              type="checkbox"
                              checked={selectedResponseIds.has(response.id)}
                              onClick={(e) => handleResponseCheckboxClick(index, e)}
                              readOnly
                              style={{ width: "1.6rem", height: "1.6rem", cursor: "pointer" }}
                            />
                            <span style={{ fontWeight: 500 }}>#{response.seq}</span>
                            <span>{response.username}</span>
                            <span style={{ fontSize: "1.1rem", color: "gray" }}>({response.authorId})</span>
                            <StatusBadge $visible={response.visible}>
                              {response.visible ? labels.visible : labels.hidden}
                            </StatusBadge>
                          </ManageResponseCardHeader>
                          <ManageResponseCardContent>
                            {response.content.substring(0, 200)}
                            {response.content.length > 200 && "..."}
                          </ManageResponseCardContent>
                          <ManageResponseCardActions>
                            <ActionButton
                              onClick={() => toggleVisibility(response.id, response.visible)}
                              disabled={togglingId === response.id}
                            >
                              {response.visible ? labels.hide : labels.restore}
                            </ActionButton>
                          </ManageResponseCardActions>
                        </ManageResponseCard>
                      ))}
                    </ManageResponseCards>
                  </>
                )}
              </>
            )}

            <ModalActions style={{ marginTop: "2rem" }}>
              <CancelButton onClick={closeManageModal}>
                {labels.close}
              </CancelButton>
            </ModalActions>
          </ManageModalContent>
        </Modal>
      )}
    </PageLayout>
  );
}
