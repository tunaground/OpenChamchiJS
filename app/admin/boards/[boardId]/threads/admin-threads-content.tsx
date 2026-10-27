"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import styled from "styled-components";
import { Pagination } from "@/components/Pagination";
import { PageLayout } from "@/components/layout";
import { AdminBoardSidebar } from "@/components/sidebar/AdminBoardSidebar";
import { formatDateTime } from "@/lib/utils/date-formatter";
import {
  Container,
  Breadcrumb,
  ActionsBar,
  Button,
  SecondaryButton,
  DangerButton,
  Badge,
  Badges,
  List,
  Item,
  ItemHeader,
  ItemTitle,
  ItemMeta,
  ItemActions,
  SmallButton,
  DangerSmallButton,
  EmptyState,
  SearchForm,
  SearchInput,
  SearchButton,
  Modal,
  ModalContent,
  ModalTitle,
  FormGroup,
  Label,
  Input,
  Checkbox,
  ModalActions,
  Muted,
} from "../../../_components/admin-ui";

/** Responses inside the "manage responses" modal scroll on their own */
const ResponseList = styled(List)`
  max-height: 60vh;
  overflow-y: auto;
`;

const ResponseHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  flex-wrap: wrap;
  margin-bottom: 0.4rem;
  font-size: 1.4rem;
`;

const ResponseContent = styled.div`
  margin-top: 0.6rem;
  font-size: 1.3rem;
  line-height: 1.5;
  color: ${(props) => props.theme.textPrimary};
  word-break: break-word;
  white-space: pre-wrap;
  max-height: 8rem;
  overflow: hidden;
`;

const BulkBar = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.2rem;
  min-height: 3.4rem;

  label {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    cursor: pointer;
    font-size: 1.3rem;
    color: ${(props) => props.theme.textSecondary};
  }

  input {
    width: 1.6rem;
    height: 1.6rem;
    accent-color: ${(props) => props.theme.accent};
  }
`;

const RowCheckbox = styled.input`
  width: 1.6rem;
  height: 1.6rem;
  cursor: pointer;
  accent-color: ${(props) => props.theme.accent};
`;

const Mono = styled.span`
  font-family: ${(props) => props.theme.fontMono};
  font-size: 1.2rem;
`;

interface ThreadData {
  id: number;
  title: string;
  username: string;
  ended: boolean;
  top: boolean;
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Labels {
  title: string;
  threadTitle: string;
  author: string;
  responses: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  actions: string;
  ended: string;
  top: string;
  active: string;
  edit: string;
  delete: string;
  view: string;
  noThreads: string;
  noResults: string;
  confirmDelete: string;
  editTitle: string;
  save: string;
  cancel: string;
  searchPlaceholder: string;
  searchButton: string;
  setTop: string;
  unsetTop: string;
  setEnded: string;
  unsetEnded: string;
  manageResponses: string;
  responsesTitle: string;
  seq: string;
  content: string;
  noResponses: string;
  confirmDeleteResponse: string;
  close: string;
  visible: string;
  hidden: string;
  deleted: string;
  hide: string;
  show: string;
  restore: string;
  confirmRestore: string;
}

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}


interface AuthLabels {
  login: string;
  logout: string;
}

interface SidebarLabels {
  backToHome: string;
  admin: string;
  boards: string;
  users: string;
  settings: string;
  globalNotices: string;
  threads: string;
  responses: string;
  notices: string;
}

interface AdminThreadsContentProps {
  boardId: string;
  boardName: string;
  authLabels: AuthLabels;
  sidebarLabels: SidebarLabels;
  isAdmin: boolean;
  threads: ThreadData[];
  pagination: PaginationData;
  search: string;
  canEdit: boolean;
  canDelete: boolean;
  labels: Labels;
}

interface ResponseData {
  id: string;
  seq: number;
  username: string;
  authorId: string;
  ip?: string;
  content: string;
  visible: boolean;
  deleted: boolean;
  createdAt: string;
}

type ModalType = "edit" | "delete" | "restore" | "responses" | "deleteResponse" | null;

interface FormData {
  title: string;
  top: boolean;
  ended: boolean;
}

export function AdminThreadsContent({
  boardId,
  boardName,
  authLabels,
  sidebarLabels,
  isAdmin,
  threads: initialThreads,
  pagination,
  search: initialSearch,
  canEdit,
  canDelete,
  labels,
}: AdminThreadsContentProps) {
  const router = useRouter();
  const locale = useLocale();
  const [threads, setThreads] = useState(initialThreads);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedThread, setSelectedThread] = useState<ThreadData | null>(null);
  const [formData, setFormData] = useState<FormData>({ title: "", top: false, ended: false });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(initialSearch);
  const [responses, setResponses] = useState<ResponseData[]>([]);
  const [selectedResponse, setSelectedResponse] = useState<ResponseData | null>(null);
  const [selectedResponseIds, setSelectedResponseIds] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [loadingResponses, setLoadingResponses] = useState(false);

  useEffect(() => {
    setThreads(initialThreads);
  }, [initialThreads]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }
    router.push(`/admin/boards/${boardId}/threads?${params.toString()}`);
  };

  const getBaseUrl = () => {
    const params = new URLSearchParams();
    if (initialSearch) {
      params.set("search", initialSearch);
    }
    const queryString = params.toString();
    return `/admin/boards/${boardId}/threads${queryString ? `?${queryString}` : ""}`;
  };

  const openEditModal = (thread: ThreadData) => {
    setFormData({
      title: thread.title,
      top: thread.top,
      ended: thread.ended,
    });
    setSelectedThread(thread);
    setModalType("edit");
  };

  const openDeleteModal = (thread: ThreadData) => {
    setSelectedThread(thread);
    setModalType("delete");
  };

  const openRestoreModal = (thread: ThreadData) => {
    setSelectedThread(thread);
    setModalType("restore");
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedThread(null);
    setSelectedResponse(null);
    setSelectedResponseIds(new Set());
    setLastSelectedIndex(null);
    setFormData({ title: "", top: false, ended: false });
    setResponses([]);
  };

  const openResponsesModal = async (thread: ThreadData) => {
    setSelectedThread(thread);
    setModalType("responses");
    setLoadingResponses(true);
    setSelectedResponseIds(new Set());
    setLastSelectedIndex(null);
    try {
      const res = await fetch(`/api/boards/${boardId}/threads/${thread.id}/responses?limit=1000&includeIp=true&includeDeleted=true`);
      if (res.ok) {
        const data = await res.json();
        // Filter out seq 0 (thread body) - it cannot be modified via this modal
        setResponses(data.filter((r: ResponseData) => r.seq !== 0));
      }
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleToggleVisible = async (response: ResponseData) => {
    if (!selectedThread) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/boards/${boardId}/threads/${selectedThread.id}/responses/${response.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ visible: !response.visible }),
        }
      );

      if (res.ok) {
        setResponses(responses.map((r) =>
          r.id === response.id ? { ...r, visible: !response.visible } : r
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDeleted = async (response: ResponseData) => {
    if (!selectedThread) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/boards/${boardId}/threads/${selectedThread.id}/responses/${response.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deleted: !response.deleted }),
        }
      );

      if (res.ok) {
        setResponses(responses.map((r) =>
          r.id === response.id ? { ...r, deleted: !response.deleted } : r
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  const _openDeleteResponseModal = (response: ResponseData) => {
    setSelectedResponse(response);
    setModalType("deleteResponse");
  };

  const handleResponseCheckboxClick = (index: number, e: React.MouseEvent<HTMLInputElement>) => {
    const id = responses[index].id;
    const newSet = new Set(selectedResponseIds);

    if (e.shiftKey && lastSelectedIndex !== null) {
      // Shift+click: select range
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      for (let i = start; i <= end; i++) {
        newSet.add(responses[i].id);
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
    if (selectedResponseIds.size === responses.length) {
      setSelectedResponseIds(new Set());
    } else {
      setSelectedResponseIds(new Set(responses.map((r) => r.id)));
    }
    setLastSelectedIndex(null);
  };

  const handleDeleteResponse = async () => {
    if (!selectedThread || !selectedResponse) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/boards/${boardId}/threads/${selectedThread.id}/responses/${selectedResponse.id}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        // Remove from local state
        setResponses(responses.filter((r) => r.id !== selectedResponse.id));
        setSelectedResponseIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(selectedResponse.id);
          return newSet;
        });
        setSelectedResponse(null);
        setModalType("responses");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteResponses = async () => {
    if (!selectedThread || selectedResponseIds.size === 0) return;
    setLoading(true);
    try {
      const deletePromises = Array.from(selectedResponseIds).map((id) =>
        fetch(
          `/api/boards/${boardId}/threads/${selectedThread.id}/responses/${id}`,
          { method: "DELETE" }
        )
      );
      await Promise.all(deletePromises);

      // Remove from local state
      setResponses(responses.filter((r) => !selectedResponseIds.has(r.id)));
      setSelectedResponseIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedThread) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/threads/${selectedThread.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        closeModal();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedThread) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/threads/${selectedThread.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        closeModal();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedThread) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/threads/${selectedThread.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted: false }),
      });

      if (res.ok) {
        closeModal();
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (thread: ThreadData, action: "top" | "ended") => {
    setLoading(true);
    try {
      const newValue = action === "top" ? !thread.top : !thread.ended;
      const res = await fetch(`/api/boards/${boardId}/threads/${thread.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [action]: newValue }),
      });

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  };


  const sidebar = (
    <AdminBoardSidebar
      boardId={boardId}
      boardName={boardName}
      labels={sidebarLabels}
      isAdmin={isAdmin}
    />
  );

  return (
    <PageLayout
      title={labels.title}
      sidebar={sidebar}
      isLoggedIn={true}
      canAccessAdmin={true}
      authLabels={authLabels}
      isAdminPage
    >
      <Container>
        <Breadcrumb>
          <Link prefetch={false} href="/admin/boards">Boards</Link> / {boardName}
        </Breadcrumb>

        <ActionsBar>
          <SearchForm onSubmit={handleSearch}>
            <SearchInput
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={labels.searchPlaceholder}
            />
            <SearchButton type="submit">{labels.searchButton}</SearchButton>
          </SearchForm>
        </ActionsBar>

      {threads.length === 0 ? (
        <EmptyState>
          {initialSearch ? labels.noResults : labels.noThreads}
        </EmptyState>
      ) : (
        <>
          <List>
            {threads.map((thread) => (
              <Item key={thread.id} $deleted={thread.deleted}>
                <ItemHeader>
                  <ItemTitle>
                    <Muted>#{thread.id}</Muted>
                    <Link prefetch={false} href={`/trace/${boardId}/${thread.id}`}>
                      {thread.title}
                    </Link>
                  </ItemTitle>
                  <Badges>
                    {thread.deleted ? (
                      <Badge $tone="danger">{labels.deleted}</Badge>
                    ) : (
                      <>
                        {thread.top && <Badge $tone="accent">{labels.top}</Badge>}
                        {thread.ended && <Badge>{labels.ended}</Badge>}
                      </>
                    )}
                  </Badges>
                </ItemHeader>
                <ItemMeta>
                  <span>{thread.username}</span>
                  <span>{formatDateTime(thread.createdAt, locale)} - {formatDateTime(thread.updatedAt, locale)}</span>
                </ItemMeta>
                <ItemActions>
                  {!thread.deleted && (
                    <SmallButton onClick={() => openResponsesModal(thread)}>
                      {labels.manageResponses}
                    </SmallButton>
                  )}
                  {canEdit && !thread.deleted && (
                    <>
                      <SmallButton
                        onClick={() => handleQuickAction(thread, "top")}
                        disabled={loading}
                      >
                        {thread.top ? labels.unsetTop : labels.setTop}
                      </SmallButton>
                      <SmallButton
                        onClick={() => handleQuickAction(thread, "ended")}
                        disabled={loading}
                      >
                        {thread.ended ? labels.unsetEnded : labels.setEnded}
                      </SmallButton>
                      <SmallButton onClick={() => openEditModal(thread)}>
                        {labels.edit}
                      </SmallButton>
                    </>
                  )}
                  {canDelete && !thread.deleted && (
                    <DangerSmallButton onClick={() => openDeleteModal(thread)}>
                      {labels.delete}
                    </DangerSmallButton>
                  )}
                  {canDelete && thread.deleted && (
                    <SmallButton onClick={() => openRestoreModal(thread)}>
                      {labels.restore}
                    </SmallButton>
                  )}
                </ItemActions>
              </Item>
            ))}
          </List>

          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            baseUrl={getBaseUrl()}
          />
        </>
      )}

      {/* Edit Modal */}
      {modalType === "edit" && selectedThread && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{labels.editTitle}</ModalTitle>

            <FormGroup>
              <Label>{labels.threadTitle}</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </FormGroup>

            <FormGroup>
              <Checkbox>
                <input
                  type="checkbox"
                  checked={formData.top}
                  onChange={(e) =>
                    setFormData({ ...formData, top: e.target.checked })
                  }
                />
                <Label style={{ marginBottom: 0 }}>{labels.top}</Label>
              </Checkbox>
            </FormGroup>

            <FormGroup>
              <Checkbox>
                <input
                  type="checkbox"
                  checked={formData.ended}
                  onChange={(e) =>
                    setFormData({ ...formData, ended: e.target.checked })
                  }
                />
                <Label style={{ marginBottom: 0 }}>{labels.ended}</Label>
              </Checkbox>
            </FormGroup>

            <ModalActions>
              <SecondaryButton onClick={closeModal} disabled={loading}>
                {labels.cancel}
              </SecondaryButton>
              <Button
                onClick={handleEdit}
                disabled={loading || !formData.title}
              >
                {labels.save}
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {modalType === "delete" && selectedThread && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{labels.delete}</ModalTitle>
            <p>{labels.confirmDelete}</p>
            <p style={{ marginTop: "0.8rem", fontWeight: 500 }}>
              {selectedThread.title}
            </p>
            <ModalActions>
              <SecondaryButton onClick={closeModal} disabled={loading}>
                {labels.cancel}
              </SecondaryButton>
              <DangerButton onClick={handleDelete} disabled={loading}>
                {labels.delete}
              </DangerButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Restore Confirmation Modal */}
      {modalType === "restore" && selectedThread && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{labels.restore}</ModalTitle>
            <p>{labels.confirmRestore}</p>
            <p style={{ marginTop: "0.8rem", fontWeight: 500 }}>
              {selectedThread.title}
            </p>
            <ModalActions>
              <SecondaryButton onClick={closeModal} disabled={loading}>
                {labels.cancel}
              </SecondaryButton>
              <Button onClick={handleRestore} disabled={loading}>
                {labels.restore}
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Responses Modal */}
      {modalType === "responses" && selectedThread && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()} style={{ maxWidth: "900px" }}>
            <ModalTitle>
              {labels.responsesTitle}: {selectedThread.title}
            </ModalTitle>

            {loadingResponses ? (
              <p>Loading...</p>
            ) : responses.length === 0 ? (
              <EmptyState>{labels.noResponses}</EmptyState>
            ) : (
              <>
                <BulkBar>
                  {canDelete && (
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedResponseIds.size === responses.length && responses.length > 0}
                        onChange={toggleAllResponses}
                      />
                      <span>전체 선택</span>
                    </label>
                  )}
                  {canDelete && selectedResponseIds.size > 0 && (
                    <DangerButton onClick={handleBulkDeleteResponses} disabled={loading}>
                      {labels.delete} ({selectedResponseIds.size})
                    </DangerButton>
                  )}
                </BulkBar>
                <ResponseList>
                  {responses.map((response, index) => (
                    <Item key={response.id} $deleted={response.deleted}>
                      <ResponseHeader>
                        {canDelete && (
                          <RowCheckbox
                            type="checkbox"
                            checked={selectedResponseIds.has(response.id)}
                            onClick={(e) => handleResponseCheckboxClick(index, e)}
                            readOnly
                          />
                        )}
                        <span style={{ fontWeight: 600 }}>#{response.seq}</span>
                        <span>{response.username}</span>
                        <Muted style={{ fontSize: "1.2rem" }}>({response.authorId})</Muted>
                        {response.deleted ? (
                          <Badge $tone="danger">{labels.deleted}</Badge>
                        ) : !response.visible ? (
                          <Badge $tone="warning">{labels.hidden}</Badge>
                        ) : (
                          <Badge $tone="success">{labels.visible}</Badge>
                        )}
                      </ResponseHeader>
                      <ItemMeta>
                        {response.ip && <Mono>{response.ip}</Mono>}
                        <span>{formatDateTime(response.createdAt, locale)}</span>
                      </ItemMeta>
                      <ResponseContent>
                        {response.content.substring(0, 200)}
                        {response.content.length > 200 && "..."}
                      </ResponseContent>
                      <ItemActions>
                        {canEdit && !response.deleted && (
                          <SmallButton
                            onClick={() => handleToggleVisible(response)}
                            disabled={loading}
                          >
                            {response.visible ? labels.hide : labels.show}
                          </SmallButton>
                        )}
                        {canDelete && (
                          <SmallButton
                            onClick={() => handleToggleDeleted(response)}
                            disabled={loading}
                          >
                            {response.deleted ? labels.restore : labels.delete}
                          </SmallButton>
                        )}
                      </ItemActions>
                    </Item>
                  ))}
                </ResponseList>
              </>
            )}

            <ModalActions>
              <SecondaryButton onClick={closeModal}>
                {labels.close}
              </SecondaryButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Delete Response Confirmation Modal */}
      {modalType === "deleteResponse" && selectedResponse && (
        <Modal onClick={() => setModalType("responses")}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{labels.delete}</ModalTitle>
            <p>{labels.confirmDeleteResponse}</p>
            <p style={{ marginTop: "0.8rem", fontWeight: 500 }}>
              #{selectedResponse.seq}: {selectedResponse.content.substring(0, 50)}
              {selectedResponse.content.length > 50 && "..."}
            </p>
            <ModalActions>
              <SecondaryButton onClick={() => setModalType("responses")} disabled={loading}>
                {labels.cancel}
              </SecondaryButton>
              <DangerButton onClick={handleDeleteResponse} disabled={loading}>
                {labels.delete}
              </DangerButton>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}
      </Container>
    </PageLayout>
  );
}
