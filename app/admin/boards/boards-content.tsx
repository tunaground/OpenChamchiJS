"use client";

import { useState } from "react";
import Link from "next/link";
import styled from "styled-components";
import { PageLayout } from "@/components/layout";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";

const Container = styled.div`
  padding: 3.2rem;
  max-width: 120rem;
  margin: 0 auto;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: 1.6rem;
  }
`;

const Header = styled.div`
  margin-bottom: 2.4rem;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
`;

const ActionsBar = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1.6rem;
  margin-bottom: 2.4rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  height: 3.5rem;
  padding: 0 1.6rem;
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

const StatusBadge = styled.span<{ $active: boolean }>`
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 1.2rem;
  font-weight: 500;
  background: ${(props) => (props.$active ? "#22c55e20" : "#ef444420")};
  color: ${(props) => (props.$active ? "#22c55e" : "#ef4444")};
`;

const BoardCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const BoardCard = styled.div`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 1.2rem;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.8rem;
`;

const CardTitle = styled.div`
  font-size: 1.4rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
`;

const CardMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 1rem;
`;

const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
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

const Input = styled.input<{ $error?: boolean }>`
  width: 100%;
  padding: 0.8rem;
  border: 1px solid ${(props) => props.$error ? "#dc2626" : props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};

  &:focus {
    outline: none;
    border-color: ${(props) => props.$error ? "#dc2626" : props.theme.textSecondary};
  }
`;

const ErrorText = styled.span`
  color: #dc2626;
  font-size: 1.2rem;
  margin-top: 0.4rem;
  display: block;
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

const BoardId = styled.code`
  font-family: monospace;
  background: ${(props) => props.theme.surfaceHover};
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
`;

interface BoardData {
  id: string;
  name: string;
  defaultUsername: string;
  deleted: boolean;
  threadCount: number;
  threadsPerPage: number;
  responsesPerPage: number;
  maxResponsesPerThread: number;
  blockForeignIp: boolean;
  showUserCount: boolean;
  createdAt: string;
}

interface Labels {
  title: string;
  createBoard: string;
  id: string;
  idPlaceholder: string;
  name: string;
  namePlaceholder: string;
  defaultUsername: string;
  defaultUsernamePlaceholder: string;
  threads: string;
  manageThreads: string;
  manageNotices: string;
  status: string;
  actions: string;
  active: string;
  deleted: string;
  edit: string;
  delete: string;
  restore: string;
  notices: string;
  noBoards: string;
  confirmDelete: string;
  confirmRestore: string;
  settings: string;
  threadsPerPage: string;
  responsesPerPage: string;
  maxResponsesPerThread: string;
  blockForeignIp: string;
  showUserCount: string;
  save: string;
  cancel: string;
  create: string;
  createTitle: string;
  editTitle: string;
  yes: string;
  no: string;
  required: string;
}

interface AuthLabels {
  login: string;
  logout: string;
}

interface SidebarLabels {
  admin: string;
  backToHome: string;
  boards: string;
  users: string;
  roles?: string;
  settings?: string;
}

interface BoardsContentProps {
  boards: BoardData[];
  authLabels: AuthLabels;
  sidebarLabels: SidebarLabels;
  canCreate: boolean;
  canUpdate: boolean;
  labels: Labels;
}

type ModalType = "create" | "edit" | "delete" | "restore" | null;

interface FormData {
  id: string;
  name: string;
  defaultUsername: string;
  threadsPerPage: number;
  responsesPerPage: number;
  maxResponsesPerThread: number;
  blockForeignIp: boolean;
  showUserCount: boolean;
}

const defaultFormData: FormData = {
  id: "",
  name: "",
  defaultUsername: "",
  threadsPerPage: 20,
  responsesPerPage: 50,
  maxResponsesPerThread: 1000,
  blockForeignIp: false,
  showUserCount: false,
};

export function BoardsContent({ boards: initialBoards, authLabels, sidebarLabels, canCreate, canUpdate, labels }: BoardsContentProps) {
  const [boards, setBoards] = useState(initialBoards);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedBoard, setSelectedBoard] = useState<BoardData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const openCreateModal = () => {
    setFormData(defaultFormData);
    setFormErrors({});
    setSelectedBoard(null);
    setModalType("create");
  };

  const openEditModal = (board: BoardData) => {
    setFormData({
      id: board.id,
      name: board.name,
      defaultUsername: board.defaultUsername,
      threadsPerPage: board.threadsPerPage,
      responsesPerPage: board.responsesPerPage,
      maxResponsesPerThread: board.maxResponsesPerThread,
      blockForeignIp: board.blockForeignIp,
      showUserCount: board.showUserCount,
    });
    setSelectedBoard(board);
    setModalType("edit");
  };

  const openDeleteModal = (board: BoardData) => {
    setSelectedBoard(board);
    setModalType("delete");
  };

  const openRestoreModal = (board: BoardData) => {
    setSelectedBoard(board);
    setModalType("restore");
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedBoard(null);
    setFormData(defaultFormData);
  };

  const validateForm = () => {
    const errors: Record<string, boolean> = {};
    if (!formData.id.trim()) errors.id = true;
    if (!formData.name.trim()) errors.name = true;
    if (!formData.defaultUsername.trim()) errors.defaultUsername = true;
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newBoard = await res.json();
        setBoards([{ ...newBoard, threadCount: 0 }, ...boards]);
        closeModal();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedBoard) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${selectedBoard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          threadsPerPage: formData.threadsPerPage,
          responsesPerPage: formData.responsesPerPage,
          maxResponsesPerThread: formData.maxResponsesPerThread,
          blockForeignIp: formData.blockForeignIp,
          showUserCount: formData.showUserCount,
        }),
      });

      if (res.ok) {
        const updatedBoard = await res.json();
        setBoards(
          boards.map((b) =>
            b.id === selectedBoard.id
              ? { ...updatedBoard, threadCount: b.threadCount }
              : b
          )
        );
        closeModal();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedBoard) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${selectedBoard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted: true }),
      });

      if (res.ok) {
        setBoards(
          boards.map((b) =>
            b.id === selectedBoard.id ? { ...b, deleted: true } : b
          )
        );
        closeModal();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedBoard) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/boards/${selectedBoard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleted: false }),
      });

      if (res.ok) {
        setBoards(
          boards.map((b) =>
            b.id === selectedBoard.id ? { ...b, deleted: false } : b
          )
        );
        closeModal();
      }
    } finally {
      setLoading(false);
    }
  };

  const sidebar = <AdminSidebar labels={sidebarLabels} />;

  return (
    <PageLayout
      title={labels.title}
      sidebar={sidebar}
      isLoggedIn={true}
      canAccessAdmin={true}
      authLabels={authLabels}
    >
      <Container>
        <Header>
          <Title>{labels.title}</Title>
        </Header>

        <ActionsBar>
          {canCreate && (
            <Button onClick={openCreateModal}>{labels.createBoard}</Button>
          )}
        </ActionsBar>

      {boards.length === 0 ? (
        <EmptyState>{labels.noBoards}</EmptyState>
      ) : (
        <BoardCards>
          {boards.map((board) => (
            <BoardCard key={board.id}>
              <CardHeader>
                <CardTitle>
                  <BoardId>{board.id}</BoardId> {board.name}
                </CardTitle>
                <StatusBadge $active={!board.deleted}>
                  {board.deleted ? labels.deleted : labels.active}
                </StatusBadge>
              </CardHeader>
              <CardMeta>
                <span>{labels.threads}: {board.threadCount}</span>
              </CardMeta>
              <CardActions>
                <Link href={`/admin/boards/${board.id}/threads`}>
                  <SmallButton>{labels.manageThreads}</SmallButton>
                </Link>
                <Link href={`/admin/boards/${board.id}/notices`}>
                  <SmallButton>{labels.manageNotices}</SmallButton>
                </Link>
                {canUpdate && (
                  <SmallButton onClick={() => openEditModal(board)}>
                    {labels.edit}
                  </SmallButton>
                )}
                {canUpdate && !board.deleted && (
                  <SmallButton onClick={() => openDeleteModal(board)}>
                    {labels.delete}
                  </SmallButton>
                )}
                {canUpdate && board.deleted && (
                  <SmallButton onClick={() => openRestoreModal(board)}>
                    {labels.restore}
                  </SmallButton>
                )}
              </CardActions>
            </BoardCard>
          ))}
        </BoardCards>
      )}

      {/* Create/Edit Modal */}
      {(modalType === "create" || modalType === "edit") && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              {modalType === "create" ? labels.createTitle : labels.editTitle}
            </ModalTitle>

            <FormGroup>
              <Label>{labels.id}</Label>
              <Input
                value={formData.id}
                onChange={(e) => {
                  setFormData({ ...formData, id: e.target.value });
                  if (formErrors.id) setFormErrors({ ...formErrors, id: false });
                }}
                disabled={modalType === "edit"}
                placeholder={labels.idPlaceholder}
                $error={formErrors.id}
              />
              {formErrors.id && <ErrorText>{labels.required}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>{labels.name}</Label>
              <Input
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) setFormErrors({ ...formErrors, name: false });
                }}
                placeholder={labels.namePlaceholder}
                $error={formErrors.name}
              />
              {formErrors.name && <ErrorText>{labels.required}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>{labels.defaultUsername}</Label>
              <Input
                value={formData.defaultUsername}
                onChange={(e) => {
                  setFormData({ ...formData, defaultUsername: e.target.value });
                  if (formErrors.defaultUsername) setFormErrors({ ...formErrors, defaultUsername: false });
                }}
                placeholder={labels.defaultUsernamePlaceholder}
                $error={formErrors.defaultUsername}
              />
              {formErrors.defaultUsername && <ErrorText>{labels.required}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>{labels.threadsPerPage}</Label>
              <Input
                type="number"
                value={formData.threadsPerPage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    threadsPerPage: parseInt(e.target.value) || 0,
                  })
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>{labels.responsesPerPage}</Label>
              <Input
                type="number"
                value={formData.responsesPerPage}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    responsesPerPage: parseInt(e.target.value) || 0,
                  })
                }
              />
            </FormGroup>

            <FormGroup>
              <Label>{labels.maxResponsesPerThread}</Label>
              <Input
                type="number"
                value={formData.maxResponsesPerThread}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxResponsesPerThread: parseInt(e.target.value) || 0,
                  })
                }
              />
            </FormGroup>

            <FormGroup>
              <Checkbox>
                <input
                  type="checkbox"
                  checked={formData.blockForeignIp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      blockForeignIp: e.target.checked,
                    })
                  }
                />
                <Label style={{ marginBottom: 0 }}>
                  {labels.blockForeignIp}
                </Label>
              </Checkbox>
            </FormGroup>

            <FormGroup>
              <Checkbox>
                <input
                  type="checkbox"
                  checked={formData.showUserCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      showUserCount: e.target.checked,
                    })
                  }
                />
                <Label style={{ marginBottom: 0 }}>
                  {labels.showUserCount}
                </Label>
              </Checkbox>
            </FormGroup>

            <ModalActions>
              <SecondaryButton onClick={closeModal} disabled={loading}>
                {labels.cancel}
              </SecondaryButton>
              <Button
                onClick={modalType === "create" ? handleCreate : handleEdit}
                disabled={loading}
              >
                {modalType === "create" ? labels.create : labels.save}
              </Button>
            </ModalActions>
          </ModalContent>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {modalType === "delete" && selectedBoard && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{labels.delete}</ModalTitle>
            <p>{labels.confirmDelete}</p>
            <p style={{ marginTop: "0.8rem" }}>
              <BoardId>{selectedBoard.id}</BoardId> - {selectedBoard.name}
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
      {modalType === "restore" && selectedBoard && (
        <Modal onClick={closeModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>{labels.restore}</ModalTitle>
            <p>{labels.confirmRestore}</p>
            <p style={{ marginTop: "0.8rem" }}>
              <BoardId>{selectedBoard.id}</BoardId> - {selectedBoard.name}
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
      </Container>
    </PageLayout>
  );
}
