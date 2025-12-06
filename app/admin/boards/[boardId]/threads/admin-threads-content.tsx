"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Pagination } from "@/components/Pagination";
import { PageLayout, AdminButton, AuthButton, ThemeToggleButton } from "@/components/layout";
import { AdminBoardSidebar } from "@/components/sidebar/AdminBoardSidebar";

const Container = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
`;

const TitleSection = styled.div``;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 0.25rem;
`;

const Breadcrumb = styled.div`
  font-size: 0.875rem;
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
  padding: 0.5rem 1rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
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
  padding: 0.75rem 1rem;
  background: ${(props) => props.theme.surfaceHover};
  font-weight: 500;
  font-size: 0.875rem;
  color: ${(props) => props.theme.textSecondary};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const Td = styled.td`
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: ${(props) => props.theme.textPrimary};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const Badge = styled.span<{ $variant?: "top" | "ended" | "active" }>`
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-right: 0.25rem;
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
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const SmallButton = styled.button`
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
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
  padding: 3rem;
  color: ${(props) => props.theme.textSecondary};
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
`;

const SearchForm = styled.form`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 300px;
  padding: 0.5rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 0.875rem;
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
  padding: 0.5rem 1rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
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
  padding: 1.5rem;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: ${(props) => props.theme.textPrimary};
`;

const FormGroup = styled.div`
  margin-bottom: 1rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 0.875rem;
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
  gap: 0.5rem;

  input {
    width: 1rem;
    height: 1rem;
  }
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
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

type ModalType = "edit" | "delete" | null;

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

  const closeModal = () => {
    setModalType(null);
    setSelectedThread(null);
    setFormData({ title: "", top: false, ended: false });
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
                <Th style={{ width: "32%" }}>{labels.threadTitle}</Th>
                <Th style={{ width: "10%" }}>{labels.author}</Th>
                <Th style={{ width: "12%" }}>{labels.status}</Th>
                <Th style={{ width: "13%" }}>{labels.updatedAt}</Th>
                <Th style={{ width: "13%" }}>{labels.createdAt}</Th>
                <Th style={{ width: "20%" }}>{labels.actions}</Th>
              </tr>
            </thead>
            <tbody>
              {threads.map((thread) => (
                <tr key={thread.id}>
                  <Td>
                    <TitleLink href={`/trace/${thread.id}`}>
                      {thread.title}
                    </TitleLink>
                  </Td>
                  <Td>{thread.username}</Td>
                  <Td>
                    {thread.top && <Badge $variant="top">{labels.top}</Badge>}
                    {thread.ended ? (
                      <Badge $variant="ended">{labels.ended}</Badge>
                    ) : (
                      <Badge $variant="active">{labels.active}</Badge>
                    )}
                  </Td>
                  <Td>{formatDate(thread.updatedAt)}</Td>
                  <Td>{formatDate(thread.createdAt)}</Td>
                  <Td>
                    <ActionButtons>
                      {canEdit && (
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
                      {canDelete && (
                        <SmallButton onClick={() => openDeleteModal(thread)}>
                          {labels.delete}
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
            <p style={{ marginTop: "0.5rem", fontWeight: 500 }}>
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
      </Container>
    </PageLayout>
  );
}
