"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Pagination } from "@/components/Pagination";
import { PageLayout, AdminButton, AuthButton, ThemeToggleButton, HomeButton } from "@/components/layout";
import { AdminBoardSidebar } from "@/components/sidebar/AdminBoardSidebar";
import { formatDateTime } from "@/lib/utils/date-formatter";

const Container = styled.div`
  padding: 3.2rem;
  max-width: 120rem;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 3.2rem;
`;

const TitleSection = styled.div``;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 0.4rem;
`;

const Breadcrumb = styled.div`
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};

  a {
    color: ${(props) => props.theme.textSecondary};
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const Button = styled.button`
  padding: 0.8rem 1.6rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: 4px;
  font-size: 1.4rem;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SecondaryButton = styled(Button)`
  background: transparent;
  color: ${(props) => props.theme.textPrimary};
  border: 1px solid ${(props) => props.theme.surfaceBorder};

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }
`;

const DangerButton = styled(Button)`
  background: #dc2626;
  color: white;

  &:hover {
    background: #b91c1c;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  overflow: hidden;
`;

const Th = styled.th`
  text-align: left;
  padding: 1.2rem 1.6rem;
  background: ${(props) => props.theme.surfaceHover};
  font-weight: 500;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textSecondary};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const Td = styled.td`
  padding: 1.2rem 1.6rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textPrimary};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const Badge = styled.span<{ $variant?: "top" | "ended" | "active" }>`
  display: inline-block;
  padding: 0.2rem 0.8rem;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 500;
  margin-right: 0.4rem;
  background: ${(props) => {
    switch (props.$variant) {
      case "top":
        return props.theme.textPrimary;
      case "ended":
        return props.theme.textSecondary + "30";
      case "active":
        return "#22c55e";
      default:
        return props.theme.textSecondary;
    }
  }};
  color: ${(props) => {
    switch (props.$variant) {
      case "top":
        return props.theme.background;
      case "ended":
        return props.theme.textSecondary;
      case "active":
        return "white";
      default:
        return props.theme.background;
    }
  }};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
`;

const SmallButton = styled.button`
  padding: 0.4rem 0.8rem;
  font-size: 1.2rem;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  background: transparent;
  color: ${(props) => props.theme.textPrimary};

  &:hover {
    background: ${(props) => props.theme.surfaceHover};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

const SearchForm = styled.form`
  display: flex;
  gap: 0.8rem;
  margin-bottom: 2.4rem;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 30rem;
  padding: 0.8rem;
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

const SearchButton = styled.button`
  padding: 0.8rem 1.6rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: 4px;
  font-size: 1.4rem;
  cursor: pointer;

  &:hover {
    opacity: 0.9;
  }
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
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 2.4rem;
  width: 100%;
  max-width: 50rem;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 2.4rem;
  color: ${(props) => props.theme.textPrimary};
`;

const FormGroup = styled.div`
  margin-bottom: 1.6rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.8rem;
  font-size: 1.4rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.8rem;

  input {
    width: 1.6rem;
    height: 1.6rem;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  margin-top: 2.4rem;
`;

const TitleLink = styled(Link)`
  color: ${(props) => props.theme.textPrimary};
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
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
  threads: string;
  notices: string;
}

interface AdminThreadsContentProps {
  boardId: string;
  boardName: string;
  authLabels: AuthLabels;
  sidebarLabels: SidebarLabels;
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
  threads: initialThreads,
  pagination,
  search: initialSearch,
  canEdit,
  canDelete,
  labels,
}: AdminThreadsContentProps) {
  const router = useRouter();
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
        setResponses(data);
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
    />
  );
  const rightContent = (
    <>
      <HomeButton />
      <ThemeToggleButton />
      <AdminButton />
      <AuthButton
        isLoggedIn={true}
        loginLabel={authLabels.login}
        logoutLabel={authLabels.logout}
      />
    </>
  );

  return (
    <PageLayout title={labels.title} sidebar={sidebar} rightContent={rightContent}>
      <Container>
        <Header>
          <TitleSection>
            <Title>{labels.title}</Title>
            <Breadcrumb>
              <Link href="/admin/boards">Boards</Link> / {boardName}
            </Breadcrumb>
          </TitleSection>
        </Header>

      <SearchForm onSubmit={handleSearch}>
        <SearchInput
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={labels.searchPlaceholder}
        />
        <SearchButton type="submit">{labels.searchButton}</SearchButton>
      </SearchForm>

      {threads.length === 0 ? (
        <EmptyState>
          {initialSearch ? labels.noResults : labels.noThreads}
        </EmptyState>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th style={{ width: "8%" }}>ID</Th>
                <Th style={{ width: "26%" }}>{labels.threadTitle}</Th>
                <Th style={{ width: "10%" }}>{labels.author}</Th>
                <Th style={{ width: "12%" }}>{labels.status}</Th>
                <Th style={{ width: "13%" }}>{labels.updatedAt}</Th>
                <Th style={{ width: "13%" }}>{labels.createdAt}</Th>
                <Th style={{ width: "20%" }}>{labels.actions}</Th>
              </tr>
            </thead>
            <tbody>
              {threads.map((thread) => (
                <tr key={thread.id} style={{ opacity: thread.deleted ? 0.5 : 1 }}>
                  <Td>{thread.id}</Td>
                  <Td>
                    <TitleLink href={`/trace/${boardId}/${thread.id}`}>
                      {thread.title}
                    </TitleLink>
                  </Td>
                  <Td>{thread.username}</Td>
                  <Td>
                    {thread.deleted ? (
                      <Badge $variant="ended">{labels.deleted}</Badge>
                    ) : (
                      <>
                        {thread.top && <Badge $variant="top">{labels.top}</Badge>}
                        {thread.ended ? (
                          <Badge $variant="ended">{labels.ended}</Badge>
                        ) : (
                          <Badge $variant="active">{labels.active}</Badge>
                        )}
                      </>
                    )}
                  </Td>
                  <Td>{formatDateTime(thread.updatedAt)}</Td>
                  <Td>{formatDateTime(thread.createdAt)}</Td>
                  <Td>
                    <ActionButtons>
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
                        <SmallButton onClick={() => openDeleteModal(thread)}>
                          {labels.delete}
                        </SmallButton>
                      )}
                      {canDelete && thread.deleted && (
                        <SmallButton onClick={() => openRestoreModal(thread)}>
                          {labels.restore}
                        </SmallButton>
                      )}
                    </ActionButtons>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
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
                {canDelete && selectedResponseIds.size > 0 && (
                  <div style={{ marginBottom: "1.6rem" }}>
                    <DangerButton onClick={handleBulkDeleteResponses} disabled={loading}>
                      {labels.delete} ({selectedResponseIds.size})
                    </DangerButton>
                  </div>
                )}
                <Table>
                  <thead>
                    <tr>
                      {canDelete && (
                        <Th style={{ width: "4%" }}>
                          <input
                            type="checkbox"
                            checked={selectedResponseIds.size === responses.length && responses.length > 0}
                            onChange={toggleAllResponses}
                            style={{ width: "1.6rem", height: "1.6rem" }}
                          />
                        </Th>
                      )}
                      <Th style={{ width: "5%" }}>{labels.seq}</Th>
                      <Th style={{ width: "8%" }}>{labels.status}</Th>
                      <Th style={{ width: "18%" }}>{labels.author}</Th>
                      <Th style={{ width: "28%" }}>{labels.content}</Th>
                      <Th style={{ width: "14%" }}>{labels.createdAt}</Th>
                      <Th style={{ width: "23%" }}>{labels.actions}</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {responses.map((response, index) => (
                      <tr key={response.id} style={{ opacity: response.deleted ? 0.5 : 1 }}>
                        {canDelete && (
                          <Td>
                            <input
                              type="checkbox"
                              checked={selectedResponseIds.has(response.id)}
                              onClick={(e) => handleResponseCheckboxClick(index, e)}
                              readOnly
                              style={{ width: "1.6rem", height: "1.6rem", cursor: "pointer" }}
                            />
                          </Td>
                        )}
                        <Td>#{response.seq}</Td>
                        <Td>
                          {response.deleted ? (
                            <Badge $variant="ended">{labels.deleted}</Badge>
                          ) : !response.visible ? (
                            <Badge style={{ background: "#f59e0b", color: "white" }}>{labels.hidden}</Badge>
                          ) : (
                            <Badge $variant="active">{labels.visible}</Badge>
                          )}
                        </Td>
                        <Td>
                          {response.username}
                          <br />
                          <span style={{ fontSize: "1.1rem", color: "gray" }}>
                            ({response.authorId})
                          </span>
                          {response.ip && (
                            <>
                              <br />
                              <span style={{ fontSize: "1.1rem", color: "#888", fontFamily: "monospace" }}>
                                {response.ip}
                              </span>
                            </>
                          )}
                        </Td>
                        <Td style={{ maxWidth: "250px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {response.content.substring(0, 80)}
                          {response.content.length > 80 && "..."}
                        </Td>
                        <Td>{formatDateTime(response.createdAt)}</Td>
                        <Td>
                          <ActionButtons>
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
                          </ActionButtons>
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
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
