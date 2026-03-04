"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { PageLayout } from "@/components/layout";
import { TraceSidebar } from "@/components/sidebar/TraceSidebar";
import { ResponseCard } from "@/components/response";
import { ResponseFormSection } from "@/components/response/ResponseFormSection";
import { AnchorPreview, useAnchorStack } from "@/components/response/AnchorPreview";
import { ImageAttachment } from "@/components/response/ImageAttachment";
import { useResponseOptions } from "@/lib/hooks/useResponseOptions";
import { useChatMode } from "@/lib/hooks/useChatMode";
import { usePresence } from "@/lib/hooks/usePresence";
import { CHANNELS } from "@/lib/realtime";
import { useTranslations } from "next-intl";
import { parse, prerender, render, toOriginalFormat, type PrerenderedRoot } from "@/lib/tom";
import { useToast } from "@/components/Toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import { formatDateTime } from "@/lib/utils/date-formatter";
import {
  requestNotificationPermission,
  createThrottledNotifier,
} from "@/lib/utils/notification";
import { getAnonId } from "@/lib/utils/anon-id";
import CustomHtml from "@/components/CustomHtml";

const Container = styled.div`
  padding: 1.6rem;

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
  word-break: break-all;
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

const LoadMoreSection = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0.8rem;
  padding: 1.2rem 1.6rem;
  margin-top: 1.6rem;
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    gap: 0.4rem;
    padding: 0.8rem;
  }
`;

const LoadMoreButton = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 0.6rem 1.2rem;
  background: ${(props) =>
    props.$primary ? props.theme.buttonPrimary : "transparent"};
  color: ${(props) =>
    props.$primary ? props.theme.buttonPrimaryText : props.theme.textSecondary};
  border: 1px solid
    ${(props) =>
      props.$primary ? "transparent" : props.theme.surfaceBorder};
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.3rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.15s ease;

  &:hover {
    opacity: 0.8;
    background: ${(props) =>
      props.$primary ? props.theme.buttonPrimary : props.theme.surfaceHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 0.6rem 0.4rem;
    font-size: 1.2rem;
  }
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
  writeLocked: string;
  unknownError: string;
  selectImage: string;
  removeImage: string;
  viewSource: string;
  copied: string;
  loadMore: string;
  loadingMore: string;
  ban: string;
  unban: string;
  threadBanned: string;
  banned: string;
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
  filter: string;
}

interface ResponseFilter {
  usernames?: string[];
  authorIds?: string[];
}

interface CustomLink {
  id: string;
  label: string;
  url: string;
}

interface ThreadDetailContentProps {
  thread: ThreadData;
  boards: { id: string; name: string }[];
  defaultUsername: string;
  tripcodeSalt?: string;
  showUserCount: boolean;
  realtimeEnabled: boolean;
  storageEnabled: boolean;
  uploadMaxSize: number;
  isLoggedIn: boolean;
  canAccessAdmin: boolean;
  canManageResponses: boolean;
  authLabels: AuthLabels;
  responses: ResponseData[];
  currentView: string;
  lastSeq: number;
  responsesPerPage: number;
  labels: Labels;
  sidebarLabels: SidebarLabels;
  customLinks?: CustomLink[];
  threadCustomHtml?: string | null;
  filter?: ResponseFilter;
  filterActive?: boolean;
}

export function ThreadDetailContent({
  thread,
  boards,
  defaultUsername,
  tripcodeSalt,
  showUserCount,
  realtimeEnabled,
  storageEnabled,
  uploadMaxSize,
  isLoggedIn,
  canAccessAdmin,
  canManageResponses,
  authLabels,
  responses: initialResponses,
  currentView,
  lastSeq,
  responsesPerPage,
  labels,
  sidebarLabels,
  customLinks,
  threadCustomHtml,
  filter,
  filterActive = true,
}: ThreadDetailContentProps) {
  const router = useRouter();
  const [responses, setResponses] = useState(initialResponses);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const pageEndRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const wasAtBottomRef = useRef(false);
  const initialScrollDone = useRef(false);
  const { showToast } = useToast();

  const alwaysBottomRef = useRef(false);

  // Capture scroll position before DOM changes, then update responses
  const addResponses = useCallback((updater: (prev: ResponseData[]) => ResponseData[]) => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    wasAtBottomRef.current = scrollTop + windowHeight >= documentHeight - 100;
    setResponses(updater);
  }, []);

  // Calculate minLoadedSeq (smallest seq excluding 0)
  const minLoadedSeq = useMemo(() => {
    const nonZeroSeqs = responses.filter((r) => r.seq > 0).map((r) => r.seq);
    return nonZeroSeqs.length > 0 ? Math.min(...nonZeroSeqs) : null;
  }, [responses]);

  // Check if there are more responses to load
  const hasMoreToLoad = minLoadedSeq !== null && minLoadedSeq > 1;

  // Load more responses
  const loadMoreResponses = useCallback(
    async (count: number) => {
      if (!hasMoreToLoad || isLoadingMore || minLoadedSeq === null) return;

      setIsLoadingMore(true);
      try {
        const endSeq = minLoadedSeq - 1;
        const startSeq = Math.max(1, endSeq - count + 1);

        const res = await fetch(
          `/api/boards/${thread.boardId}/threads/${thread.id}/responses?startSeq=${startSeq}&endSeq=${endSeq}`
        );

        if (res.ok) {
          const data = await res.json();
          // Merge new responses: insert after seq 0, dedupe by id
          setResponses((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const seq0Response = prev.find((r) => r.seq === 0);
            const otherResponses = prev.filter((r) => r.seq > 0);
            // Only add responses that don't already exist
            const newResponses = (data as ResponseData[]).filter(
              (r) => !existingIds.has(r.id)
            );
            // Sort by seq
            const merged = [...otherResponses, ...newResponses].sort(
              (a, b) => a.seq - b.seq
            );
            return seq0Response ? [seq0Response, ...merged] : merged;
          });
        }
      } catch (error) {
        console.error("Failed to load more responses:", error);
      } finally {
        setIsLoadingMore(false);
      }
    },
    [hasMoreToLoad, isLoadingMore, minLoadedSeq, thread.boardId, thread.id]
  );

  // Response options
  const {
    options: responseOptions,
    toggleOption,
    isGlobalActive,
    hasThreadOverride,
    resetAllThreadOptions,
  } = useResponseOptions(thread.boardId, thread.id);

  // Sync alwaysBottom ref for autoResize callback
  alwaysBottomRef.current = responseOptions.alwaysBottom;

  // Track the current last seq for chat mode
  const currentLastSeq = useMemo(() => {
    if (responses.length === 0) return lastSeq;
    return Math.max(lastSeq, ...responses.map((r) => r.seq));
  }, [responses, lastSeq]);

  // Fetch new responses after current last seq
  const fetchNewResponses = useCallback(async () => {
    try {
      const afterSeq = currentLastSeq;
      const res = await fetch(
        `/api/boards/${thread.boardId}/threads/${thread.id}/responses?startSeq=${afterSeq + 1}&endSeq=${afterSeq + 1000}`
      );
      if (res.ok) {
        const data = await res.json();
        if ((data as ResponseData[]).length > 0) {
          addResponses((prev) => {
            const existingIds = new Set(prev.map((r) => r.id));
            const newResponses = (data as ResponseData[]).filter(
              (r) => !existingIds.has(r.id)
            );
            if (newResponses.length === 0) return prev;
            return [...prev, ...newResponses].sort((a, b) => a.seq - b.seq);
          });
        }
      }
    } catch (error) {
      console.error("Failed to fetch new responses:", error);
    }
  }, [thread.boardId, thread.id, currentLastSeq, addResponses]);

  // Throttled notification for chat mode (1 second throttle, shows last response only)
  const throttledNotify = useMemo(() => createThrottledNotifier(1000), []);

  // Anonymous ID for identifying own messages in chat mode
  const anonId = useMemo(() => getAnonId(), []);

  // Filter navigation handlers
  const handleUsernameFilter = useCallback((username: string) => {
    const params = new URLSearchParams();
    // Keep existing usernames and add new one if not already present
    const existingUsernames = filter?.usernames || [];
    const newUsernames = existingUsernames.includes(username)
      ? existingUsernames
      : [...existingUsernames, username];
    newUsernames.forEach(u => params.append("username", u));
    // Keep existing authorIds
    filter?.authorIds?.forEach(a => params.append("authorId", a));
    // Keep filterActive state
    if (!filterActive) {
      params.set("filterActive", "false");
    }
    router.push(`/trace/${thread.boardId}/${thread.id}/recent?${params.toString()}`);
  }, [router, thread.boardId, thread.id, filter, filterActive]);

  const handleAuthorIdFilter = useCallback((authorId: string) => {
    const params = new URLSearchParams();
    // Keep existing usernames
    filter?.usernames?.forEach(u => params.append("username", u));
    // Keep existing authorIds and add new one if not already present
    const existingAuthorIds = filter?.authorIds || [];
    const newAuthorIds = existingAuthorIds.includes(authorId)
      ? existingAuthorIds
      : [...existingAuthorIds, authorId];
    newAuthorIds.forEach(a => params.append("authorId", a));
    // Keep filterActive state
    if (!filterActive) {
      params.set("filterActive", "false");
    }
    router.push(`/trace/${thread.boardId}/${thread.id}/recent?${params.toString()}`);
  }, [router, thread.boardId, thread.id, filter, filterActive]);

  // Filter removal handlers
  const handleRemoveUsernameFilter = useCallback((usernameToRemove: string) => {
    const params = new URLSearchParams();
    // Keep other usernames
    filter?.usernames?.filter(u => u !== usernameToRemove).forEach(u => params.append("username", u));
    // Keep all authorIds
    filter?.authorIds?.forEach(a => params.append("authorId", a));
    // Keep filterActive state
    if (!filterActive) {
      params.set("filterActive", "false");
    }

    const queryString = params.toString();
    if (queryString) {
      router.push(`/trace/${thread.boardId}/${thread.id}/recent?${queryString}`);
    } else {
      router.push(`/trace/${thread.boardId}/${thread.id}/recent`);
    }
  }, [router, thread.boardId, thread.id, filter, filterActive]);

  const handleRemoveAuthorIdFilter = useCallback((authorIdToRemove: string) => {
    const params = new URLSearchParams();
    // Keep all usernames
    filter?.usernames?.forEach(u => params.append("username", u));
    // Keep other authorIds
    filter?.authorIds?.filter(a => a !== authorIdToRemove).forEach(a => params.append("authorId", a));
    // Keep filterActive state
    if (!filterActive) {
      params.set("filterActive", "false");
    }

    const queryString = params.toString();
    if (queryString) {
      router.push(`/trace/${thread.boardId}/${thread.id}/recent?${queryString}`);
    } else {
      router.push(`/trace/${thread.boardId}/${thread.id}/recent`);
    }
  }, [router, thread.boardId, thread.id, filter, filterActive]);

  // Toggle filter active state
  const handleToggleFilterActive = useCallback(() => {
    const params = new URLSearchParams();
    // Keep all filter values
    filter?.usernames?.forEach(u => params.append("username", u));
    filter?.authorIds?.forEach(a => params.append("authorId", a));
    // Toggle filterActive
    if (filterActive) {
      params.set("filterActive", "false");
    }
    // When re-activating, don't add filterActive param (default is true)

    const queryString = params.toString();
    router.push(`/trace/${thread.boardId}/${thread.id}/recent?${queryString}`);
  }, [router, thread.boardId, thread.id, filter, filterActive]);

  // Request notification permission when chat mode is enabled
  useEffect(() => {
    if (responseOptions.chatMode) {
      requestNotificationPermission();
    }
  }, [responseOptions.chatMode]);

  // Chat mode: handle new responses from realtime
  const handleNewResponse = useCallback((newResponse: ResponseData & { anonId?: string }) => {
    // Apply filter for chat mode if active (only when filterActive is true)
    if (filterActive && filter) {
      const matchesUsername = filter.usernames?.includes(newResponse.username);
      const matchesAuthorId = filter.authorIds?.includes(newResponse.authorId);
      if (!matchesUsername && !matchesAuthorId) {
        return; // Skip responses that don't match filter
      }
    }

    addResponses((prev) => {
      // Avoid duplicates
      if (prev.some((r) => r.id === newResponse.id)) {
        return prev;
      }
      return [...prev, newResponse];
    });

    // Skip notification for own messages
    if (newResponse.anonId === anonId) {
      return;
    }

    // Browser notification
    const body = `${newResponse.username}: ${newResponse.content}`;
    throttledNotify(thread.title, body);
  }, [throttledNotify, thread.title, anonId, filter, filterActive, addResponses]);

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

  // Also enter board-level presence so index page aggregates trace users
  const boardChannel = CHANNELS.board(thread.boardId);
  usePresence(boardChannel, showUserCount);

  // Anchor preview stack (using shared hook)
  const {
    anchorStack,
    handleAnchorClick,
    closeAnchorPreview,
    anchorPrerenderedContents,
  } = useAnchorStack();

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

  // Manage modal state
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [managePassword, setManagePassword] = useState("");
  const [manageUnlocked, setManageUnlocked] = useState(false);
  const [manageUnlockedByAdmin, setManageUnlockedByAdmin] = useState(false);
  const [manageError, setManageError] = useState("");
  const [allResponses, setAllResponses] = useState<(ResponseData & { visible: boolean })[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [selectedResponseIds, setSelectedResponseIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkBanning, setBulkBanning] = useState(false);
  const [bannedAuthorIds, setBannedAuthorIds] = useState<Map<string, string>>(new Map());

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

  // alwaysBottom: scroll to bottom on initial page load
  useEffect(() => {
    if (!initialScrollDone.current && responseOptions.alwaysBottom && pageEndRef.current) {
      initialScrollDone.current = true;
      pageEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [responseOptions.alwaysBottom]);

  // Scroll to bottom when responses change, only if user was at bottom before the update
  useEffect(() => {
    if (!pageEndRef.current) return;
    if (responseOptions.alwaysBottom && wasAtBottomRef.current) {
      pageEndRef.current.scrollIntoView({ behavior: "instant" });
    }
  }, [responseOptions.alwaysBottom, responses]);

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

  const t = useTranslations();

  // Stable copy callback
  const handleCopy = useCallback(() => {
    showToast(labels.copied);
  }, [showToast, labels.copied]);

  // Stable attachment renderer
  const attachmentRenderer = useCallback((src: string) =>
    src.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
    src.includes("/storage/") ? (
      <ImageAttachment src={src} />
    ) : (
      <AttachmentLink
        href={src}
        target="_blank"
        rel="noopener noreferrer"
      >
        📎 Attachment
      </AttachmentLink>
    ), []);

  // Memoize TOM render results
  const renderedContents = useMemo(() => {
    const map = new Map<string, React.ReactNode>();
    for (const response of responses) {
      const prerendered = prerenderedContents.get(response.id);
      if (prerendered) {
        const mainKey = `main:${response.id}`;
        map.set(response.id, render(prerendered, {
          boardId: thread.boardId,
          threadId: thread.id,
          responseId: mainKey,
          setAnchorInfo: handleAnchorClick,
          t,
          onCopy: handleCopy,
        }));
      }
    }
    return map;
  }, [prerenderedContents, responses, thread.boardId, thread.id, handleAnchorClick, t, handleCopy]);

  // Manage modal handlers
  const openManageModal = async () => {
    setManageModalOpen(true);
    setManagePassword("");
    setManageError("");
    setAllResponses([]);

    // If user has manage permission, skip password and load responses directly
    if (canManageResponses) {
      setManageUnlocked(true);
      setManageUnlockedByAdmin(true);
      setLoadingResponses(true);

      try {
        const [res, bansRes] = await Promise.all([
          fetch(
            `/api/boards/${thread.boardId}/threads/${thread.id}/responses?includeHidden=true&limit=10000`
          ),
          fetch(
            `/api/boards/${thread.boardId}/threads/${thread.id}/bans`
          ),
        ]);
        if (res.ok) {
          const data = await res.json();
          setAllResponses(data.filter((r: ResponseData & { visible: boolean }) => r.seq !== 0));
        }
        if (bansRes.ok) {
          const bans = await bansRes.json();
          const map = new Map<string, string>();
          bans.forEach((b: { id: string; authorId: string }) => map.set(b.authorId, b.id));
          setBannedAuthorIds(map);
        }
      } catch (e) {
        setManageError(`Network error: ${e instanceof Error ? e.message : String(e)}`);
      } finally {
        setLoadingResponses(false);
      }
    } else {
      setManageUnlocked(false);
      setManageUnlockedByAdmin(false);
    }
  };

  const closeManageModal = () => {
    setManageModalOpen(false);
    setManagePassword("");
    setManageUnlocked(false);
    setManageUnlockedByAdmin(false);
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
      // Password-based unlock (for non-admin users)
      const res = await fetch(
        `/api/boards/${thread.boardId}/threads/${thread.id}/responses?includeHidden=true&limit=10000`,
        {
          headers: {
            "X-Thread-Password": btoa(encodeURIComponent(managePassword)),
          },
        }
      );

      if (res.ok) {
        const [data, bansRes] = await Promise.all([
          res.json(),
          fetch(`/api/boards/${thread.boardId}/threads/${thread.id}/bans`, {
            headers: { "X-Thread-Password": btoa(encodeURIComponent(managePassword)) },
          }),
        ]);
        // Filter out seq 0 (thread body) - it cannot be modified via this modal
        setAllResponses(data.filter((r: ResponseData & { visible: boolean }) => r.seq !== 0));
        if (bansRes.ok) {
          const bans = await bansRes.json();
          const map = new Map<string, string>();
          bans.forEach((b: { id: string; authorId: string }) => map.set(b.authorId, b.id));
          setBannedAuthorIds(map);
        }
        setManageUnlocked(true);
        setManageUnlockedByAdmin(false); // Password-based unlock
      } else {
        setManageError(labels.invalidPassword);
      }
    } catch (e) {
      setManageError(`Network error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoadingResponses(false);
    }
  };

  const toggleVisibility = async (responseId: string, currentVisible: boolean) => {
    setTogglingId(responseId);

    try {
      // If unlocked by admin, use admin API (no password needed)
      // Otherwise, use password-based API
      const body = manageUnlockedByAdmin
        ? { visible: !currentVisible }
        : { password: managePassword, visible: !currentVisible };

      const res = await fetch(
        `/api/boards/${thread.boardId}/threads/${thread.id}/responses/${responseId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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
      // If unlocked by admin, use admin API (no password needed)
      // Otherwise, use password-based API
      const body = manageUnlockedByAdmin
        ? { visible: false }
        : { password: managePassword, visible: false };

      const hidePromises = Array.from(selectedResponseIds).map((id) =>
        fetch(
          `/api/boards/${thread.boardId}/threads/${thread.id}/responses/${id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
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

  const handleBulkBan = async () => {
    if (selectedResponseIds.size === 0) return;
    setBulkBanning(true);
    try {
      const authorIdSet = new Set<string>();
      for (const id of selectedResponseIds) {
        const response = allResponses.find((r) => r.id === id);
        if (response) authorIdSet.add(response.authorId);
      }
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (managePassword) {
        headers["X-Thread-Password"] = btoa(encodeURIComponent(managePassword));
      }
      const res = await fetch(
        `/api/boards/${thread.boardId}/threads/${thread.id}/bans`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ authorIds: [...authorIdSet] }),
        }
      );
      if (res.ok) {
        const bans = await res.json();
        setBannedAuthorIds((prev) => {
          const map = new Map(prev);
          for (const ban of bans as { id: string; authorId: string }[]) {
            map.set(ban.authorId, ban.id);
          }
          return map;
        });
        setSelectedResponseIds(new Set());
        showToast(labels.ban);
      }
    } finally {
      setBulkBanning(false);
    }
  };

  const handleSingleBan = async (authorId: string) => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (managePassword) {
      headers["X-Thread-Password"] = btoa(encodeURIComponent(managePassword));
    }
    const res = await fetch(
      `/api/boards/${thread.boardId}/threads/${thread.id}/bans`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ authorIds: [authorId] }),
      }
    );
    if (res.ok) {
      const bans = await res.json();
      setBannedAuthorIds((prev) => {
        const map = new Map(prev);
        for (const ban of bans as { id: string; authorId: string }[]) {
          map.set(ban.authorId, ban.id);
        }
        return map;
      });
    }
  };

  const handleUnban = async (authorId: string) => {
    const banId = bannedAuthorIds.get(authorId);
    if (!banId) return;
    const headers: Record<string, string> = {};
    if (managePassword) {
      headers["X-Thread-Password"] = btoa(encodeURIComponent(managePassword));
    }
    const res = await fetch(
      `/api/boards/${thread.boardId}/threads/${thread.id}/bans/${banId}`,
      { method: "DELETE", headers }
    );
    if (res.ok) {
      setBannedAuthorIds((prev) => {
        const map = new Map(prev);
        map.delete(authorId);
        return map;
      });
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
      customLinks={customLinks}
      labels={sidebarLabels}
      onManageClick={openManageModal}
      filter={filter}
      filterActive={filterActive}
      onRemoveUsernameFilter={handleRemoveUsernameFilter}
      onRemoveAuthorIdFilter={handleRemoveAuthorIdFilter}
      onToggleFilterActive={handleToggleFilterActive}
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
            #{thread.id} {thread.title} ({lastSeq})
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
              <AnchorPreview
                anchorStack={anchorStack}
                sourceKey={mainKey}
                prerenderedContents={anchorPrerenderedContents}
                onAnchorClick={handleAnchorClick}
                onClose={closeAnchorPreview}
                closeLabel={labels.close}
                onCopy={handleCopy}
              />
              <ResponseCard
                response={response}
                boardId={thread.boardId}
                threadId={thread.id}
                onCopy={handleCopy}
                onUsernameClick={handleUsernameFilter}
                onAuthorIdClick={handleAuthorIdFilter}
                showRawContent={rawContentIds.has(response.id)}
                rawContent={toOriginalFormat(response.content)}
                headerActions={
                  <RawContentButton
                    $active={rawContentIds.has(response.id)}
                    onClick={() => toggleRawContent(response.id)}
                    title={labels.viewSource}
                  >
                    <FontAwesomeIcon icon={faCode} />
                  </RawContentButton>
                }
                attachmentRenderer={attachmentRenderer}
                prerenderedContent={renderedContents.get(response.id)}
              />
              {/* Custom HTML slot - shown after seq 0 */}
              {response.seq === 0 && threadCustomHtml && (
                <CustomHtml html={threadCustomHtml} style={{ marginTop: '1.6rem' }} />
              )}
              {/* Load More button - shown after seq 0 */}
              {response.seq === 0 && hasMoreToLoad && (
                <LoadMoreSection>
                  <LoadMoreButton
                    $primary
                    onClick={() => loadMoreResponses(10)}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? labels.loadingMore : labels.loadMore}
                  </LoadMoreButton>
                  {[50, 100, 200, 500, 1000].map((count) => (
                    <LoadMoreButton
                      key={count}
                      onClick={() => loadMoreResponses(count)}
                      disabled={isLoadingMore}
                    >
                      {count}
                    </LoadMoreButton>
                  ))}
                </LoadMoreSection>
              )}
            </div>
            );
          })
        )}
      </ResponsesSection>

      <ResponseFormSection
        thread={thread}
        defaultUsername={defaultUsername}
        tripcodeSalt={tripcodeSalt}
        responseOptions={responseOptions}
        toggleOption={toggleOption}
        isGlobalActive={isGlobalActive}
        hasThreadOverride={hasThreadOverride}
        resetAllThreadOptions={resetAllThreadOptions}
        realtimeEnabled={realtimeEnabled}
        storageEnabled={storageEnabled}
        uploadMaxSize={uploadMaxSize}
        currentLastSeq={currentLastSeq}
        anonId={anonId}
        labels={labels}
        alwaysBottomRef={alwaysBottomRef}
        isAtBottomRef={isAtBottomRef}
        pageEndRef={pageEndRef}
        onSubmitSuccess={fetchNewResponses}
      />
      <div ref={pageEndRef} />
      </Container>

      {/* Manage Responses Modal */}
      {manageModalOpen && (
        <Modal onClick={closeManageModal}>
          <ManageModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{labels.manageModalTitle}</ModalTitle>

            {loadingResponses ? (
              <ModalDescription style={{ textAlign: "center" }}>Loading...</ModalDescription>
            ) : !manageUnlocked ? (
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
                        <>
                          <ConfirmButton onClick={handleBulkHide} disabled={bulkDeleting}>
                            {labels.hide} ({selectedResponseIds.size})
                          </ConfirmButton>
                          <ConfirmButton onClick={handleBulkBan} disabled={bulkBanning}>
                            {labels.ban} ({selectedResponseIds.size})
                          </ConfirmButton>
                        </>
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
                            {bannedAuthorIds.has(response.authorId) && (
                              <StatusBadge $visible={false}>
                                {labels.banned}
                              </StatusBadge>
                            )}
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
                            {bannedAuthorIds.has(response.authorId) ? (
                              <ActionButton onClick={() => handleUnban(response.authorId)}>
                                {labels.unban}
                              </ActionButton>
                            ) : (
                              <ActionButton onClick={() => handleSingleBan(response.authorId)}>
                                {labels.ban}
                              </ActionButton>
                            )}
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
