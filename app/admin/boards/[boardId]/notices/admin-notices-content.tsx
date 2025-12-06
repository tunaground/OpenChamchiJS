"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Pagination } from "@/components/Pagination";
import { PageLayout, AdminButton, AuthButton, ThemeToggleButton, HomeButton } from "@/components/layout";
import { AdminBoardSidebar } from "@/components/sidebar/AdminBoardSidebar";

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

const PinnedBadge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.8rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 500;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.8rem;
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
  max-width: 60rem;
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

const Textarea = styled.textarea`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};
  min-height: 15rem;
  resize: vertical;
  font-family: inherit;

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

interface NoticeData {
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Labels {
  title: string;
  createNotice: string;
  noticeTitle: string;
  content: string;
  pinned: string;
  createdAt: string;
  actions: string;
  edit: string;
  delete: string;
  noNotices: string;
  noResults: string;
  save: string;
  cancel: string;
  create: string;
  createTitle: string;
  editTitle: string;
  confirmDelete: string;
  titlePlaceholder: string;
  contentPlaceholder: string;
  searchPlaceholder: string;
  searchButton: string;
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

interface AdminNoticesContentProps {
  boardId: string;
  boardName: string;
  authLabels: AuthLabels;
  sidebarLabels: SidebarLabels;
  notices: NoticeData[];
  pagination: PaginationData;
  search: string;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  labels: Labels;
}

type ModalType = "create" | "edit" | "delete" | null;

interface FormData {
  title: string;
  content: string;
  pinned: boolean;
}

const defaultFormData: FormData = {
  title: "",
  content: "",
  pinned: false,
};

export function AdminNoticesContent({
  boardId,
  boardName,
  authLabels,
  sidebarLabels,
  notices: initialNotices,
  pagination,
  search: initialSearch,
  canCreate,
  canUpdate,
  canDelete,
  labels,
}: AdminNoticesContentProps) {
  const router = useRouter();
  const [notices, setNotices] = useState(initialNotices);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedNotice, setSelectedNotice] = useState<NoticeData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    setNotices(initialNotices);
  }, [initialNotices]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) {
      params.set("search", search.trim());
    }
    router.push(`/admin/boards/${boardId}/notices?${params.toString()}`);
  };

  const getBaseUrl = () => {
    const params = new URLSearchParams();
    if (initialSearch) {
      params.set("search", initialSearch);
    }
    const queryString = params.toString();
    return `/admin/boards/${boardId}/notices${queryString ? `?${queryString}` : ""}`;
  };

  const openCreateModal = () => {
    setFormData(defaultFormData);
    setSelectedNotice(null);
    setModalType("create");
  };

  const openEditModal = (notice: NoticeData) => {
    setFormData({
      title: notice.title,
      content: notice.content,
      pinned: notice.pinned,
    });
    setSelectedNotice(notice);
    setModalType("edit");
  };

  const openDeleteModal = (notice: NoticeData) => {
    setSelectedNotice(notice);
    setModalType("delete");
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedNotice(null);
    setFormData(defaultFormData);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/notices`, {
        method: "POST",
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

  const handleEdit = async () => {
    if (!selectedNotice) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/notices/${selectedNotice.id}`, {
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
    if (!selectedNotice) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${boardId}/notices/${selectedNotice.id}`, {
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
          {canCreate && (
            <Button onClick={openCreateModal}>{labels.createNotice}</Button>
          )}
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

      {notices.length === 0 ? (
        <EmptyState>
          {initialSearch ? labels.noResults : labels.noNotices}
        </EmptyState>
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th style={{ width: "50%" }}>{labels.noticeTitle}</Th>
                <Th style={{ width: "15%" }}>{labels.pinned}</Th>
                <Th style={{ width: "15%" }}>{labels.createdAt}</Th>
                <Th style={{ width: "20%" }}>{labels.actions}</Th>
              </tr>
            </thead>
            <tbody>
              {notices.map((notice) => (
                <tr key={notice.id}>
                  <Td>{notice.title}</Td>
                  <Td>
                    {notice.pinned && <PinnedBadge>{labels.pinned}</PinnedBadge>}
                  </Td>
                  <Td>{formatDate(notice.createdAt)}</Td>
                  <Td>
                    <ActionButtons>
                      {canUpdate && (
                        <SmallButton onClick={() => openEditModal(notice)}>
                          {labels.edit}
                        </SmallButton>
                      )}
                      {canDelete && (
                        <SmallButton onClick={() => openDeleteModal(notice)}>
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

      {/* Create/Edit Modal */}
      {(modalType === "create" || modalType === "edit") && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {modalType === "create" ? labels.createTitle : labels.editTitle}
            </ModalTitle>

            <FormGroup>
              <Label>{labels.noticeTitle}</Label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder={labels.titlePlaceholder}
              />
            </FormGroup>

            <FormGroup>
              <Label>{labels.content}</Label>
              <Textarea
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                placeholder={labels.contentPlaceholder}
              />
            </FormGroup>

            <FormGroup>
              <Checkbox>
                <input
                  type="checkbox"
                  checked={formData.pinned}
                  onChange={(e) =>
                    setFormData({ ...formData, pinned: e.target.checked })
                  }
                />
                <Label style={{ marginBottom: 0 }}>{labels.pinned}</Label>
              </Checkbox>
            </FormGroup>

            <ModalActions>
              <SecondaryButton onClick={closeModal} disabled={loading}>
                {labels.cancel}
              </SecondaryButton>
              <Button
                onClick={modalType === "create" ? handleCreate : handleEdit}
                disabled={loading || !formData.title || !formData.content}
              >
                {modalType === "create" ? labels.create : labels.save}
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {modalType === "delete" && selectedNotice && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{labels.delete}</ModalTitle>
            <p>{labels.confirmDelete}</p>
            <p style={{ marginTop: "0.8rem", fontWeight: 500 }}>
              {selectedNotice.title}
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
