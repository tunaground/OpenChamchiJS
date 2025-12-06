"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { PageLayout, AdminButton, AuthButton, ThemeToggleButton, HomeButton } from "@/components/layout";
import { TraceSidebar } from "@/components/sidebar/TraceSidebar";
import { useTranslations } from "next-intl";
import { parse, prerender, render, type PrerenderedRoot, type AnchorInfo } from "@/lib/tom";
import { formatDateTime } from "@/lib/utils/date-formatter";

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
  gap: 2.4rem;
  flex-wrap: wrap;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
`;

const MetaItem = styled.span`
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

const ResponseAttachment = styled.div`
  padding: 0 1.6rem 1.6rem;
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
  max-width: 70rem;
`;

const ResponseTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1.6rem;
  font-size: 1.4rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 1rem;
  background: ${(props) => props.theme.surfaceHover};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
  font-weight: 500;
`;

const Td = styled.td`
  padding: 1rem;
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
  vertical-align: middle;
`;

const StatusBadge = styled.span<{ $visible: boolean }>`
  display: inline-block;
  padding: 0.3rem 0.6rem;
  border-radius: 4px;
  font-size: 1.2rem;
  background: ${(props) => props.$visible ? props.theme.success + "20" : props.theme.error + "20"};
  color: ${(props) => props.$visible ? props.theme.success : props.theme.error};
`;

const ActionButton = styled.button`
  padding: 0.4rem 0.8rem;
  background: transparent;
  color: ${(props) => props.theme.textSecondary};
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

const ContentPreview = styled.span`
  display: inline-block;
  max-width: 20rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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

  // Anchor preview stack state
  interface AnchorStackItem {
    info: AnchorInfo;
    responses: ResponseData[];
    loading: boolean;
  }
  const [anchorStack, setAnchorStack] = useState<AnchorStackItem[]>([]);

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

  useEffect(() => {
    setResponses(initialResponses);
  }, [initialResponses]);

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
    } finally {
      setSubmitting(false);
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
        setAllResponses(data);
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
  const rightContent = (
    <>
      <HomeButton />
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
    <PageLayout title={thread.title} sidebar={sidebar} rightContent={rightContent} compactSidebarOnMobile>
      <Container>
        <ThreadHeader>
          <ThreadTitle>
            &gt;{thread.id}&gt; {thread.title} ({Math.max(0, responses.length - 1)})
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
              <MetaValue>{formatDateTime(thread.updatedAt)}</MetaValue>
            </MetaItem>
            <MetaItem>
              <MetaLabel>{labels.createdAt}:</MetaLabel>
              <MetaValue>{formatDateTime(thread.createdAt)}</MetaValue>
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
                  </ResponseInfo>
                </ResponseHeader>
                <ResponseContent>
                  {prerenderedContents.has(response.id)
                    ? render(prerenderedContents.get(response.id)!, {
                        boardId: thread.boardId,
                        threadId: thread.id,
                        responseId: mainKey,
                        setAnchorInfo: handleAnchorClick,
                        t,
                      })
                    : response.content}
                </ResponseContent>
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
            </div>
            );
          })
        )}
      </ResponsesSection>

      {thread.ended ? (
        <EndedNotice>{labels.threadEnded}</EndedNotice>
      ) : (
        <ResponseForm onSubmit={handleSubmit}>
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
                  <ResponseTable>
                    <thead>
                      <tr>
                        <Th style={{ width: "10%" }}>{labels.seq}</Th>
                        <Th style={{ width: "45%" }}>{labels.content}</Th>
                        <Th style={{ width: "20%" }}>{labels.status}</Th>
                        <Th style={{ width: "25%" }}>{labels.actions}</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {allResponses.map((response) => (
                        <tr key={response.id}>
                          <Td>#{response.seq}</Td>
                          <Td>
                            <ContentPreview>{response.content}</ContentPreview>
                          </Td>
                          <Td>
                            <StatusBadge $visible={response.visible}>
                              {response.visible ? labels.visible : labels.hidden}
                            </StatusBadge>
                          </Td>
                          <Td>
                            <ActionButton
                              onClick={() => toggleVisibility(response.id, response.visible)}
                              disabled={togglingId === response.id}
                            >
                              {response.visible ? labels.hide : labels.restore}
                            </ActionButton>
                          </Td>
                        </tr>
                      ))}
                    </tbody>
                  </ResponseTable>
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
