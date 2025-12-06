"use client";

import { useState } from "react";
import styled from "styled-components";

const Container = styled.div`
  min-height: 100vh;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
`;

const Button = styled.button`
  padding: 0.5rem 1rem;
  background: ${(props) => props.theme.textPrimary};
  color: ${(props) => props.theme.background};
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
  padding: 1rem;
  background: ${(props) => props.theme.surfaceHover};
  font-weight: 500;
  font-size: 0.875rem;
  color: ${(props) => props.theme.textSecondary};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const Td = styled.td`
  padding: 1rem;
  font-size: 0.875rem;
  color: ${(props) => props.theme.textPrimary};
  border-bottom: 1px solid ${(props) => props.theme.surfaceBorder};
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  background: ${(props) => (props.$active ? "#22c55e20" : "#ef444420")};
  color: ${(props) => (props.$active ? "#22c55e" : "#ef4444")};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
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
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
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

const BoardId = styled.code`
  font-family: monospace;
  background: ${(props) => props.theme.surfaceHover};
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
`;

interface BoardData {
  id: string;
  name: string;
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
  name: string;
  threads: string;
  status: string;
  actions: string;
  active: string;
  deleted: string;
  edit: string;
  delete: string;
  restore: string;
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
}

interface BoardsContentProps {
  boards: BoardData[];
  canCreate: boolean;
  canUpdate: boolean;
  labels: Labels;
}

type ModalType = "create" | "edit" | "delete" | "restore" | null;

interface FormData {
  id: string;
  name: string;
  threadsPerPage: number;
  responsesPerPage: number;
  maxResponsesPerThread: number;
  blockForeignIp: boolean;
  showUserCount: boolean;
}

const defaultFormData: FormData = {
  id: "",
  name: "",
  threadsPerPage: 20,
  responsesPerPage: 50,
  maxResponsesPerThread: 1000,
  blockForeignIp: false,
  showUserCount: false,
};

export function BoardsContent({ boards: initialBoards, canCreate, canUpdate, labels }: BoardsContentProps) {
  const [boards, setBoards] = useState(initialBoards);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedBoard, setSelectedBoard] = useState<BoardData | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [loading, setLoading] = useState(false);

  const openCreateModal = () => {
    setFormData(defaultFormData);
    setSelectedBoard(null);
    setModalType("create");
  };

  const openEditModal = (board: BoardData) => {
    setFormData({
      id: board.id,
      name: board.name,
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

  const handleCreate = async () => {
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

  return (
    <Container>
      <Header>
        <Title>{labels.title}</Title>
        {canCreate && (
          <Button onClick={openCreateModal}>{labels.createBoard}</Button>
        )}
      </Header>

      {boards.length === 0 ? (
        <EmptyState>{labels.noBoards}</EmptyState>
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>{labels.id}</Th>
              <Th>{labels.name}</Th>
              <Th>{labels.threads}</Th>
              <Th>{labels.status}</Th>
              <Th>{labels.actions}</Th>
            </tr>
          </thead>
          <tbody>
            {boards.map((board) => (
              <tr key={board.id}>
                <Td>
                  <BoardId>{board.id}</BoardId>
                </Td>
                <Td>{board.name}</Td>
                <Td>{board.threadCount}</Td>
                <Td>
                  <StatusBadge $active={!board.deleted}>
                    {board.deleted ? labels.deleted : labels.active}
                  </StatusBadge>
                </Td>
                <Td>
                  <ActionButtons>
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
                  </ActionButtons>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
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
                onChange={(e) =>
                  setFormData({ ...formData, id: e.target.value })
                }
                disabled={modalType === "edit"}
                placeholder="board-id"
              />
            </FormGroup>

            <FormGroup>
              <Label>{labels.name}</Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Board Name"
              />
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
            <p style={{ marginTop: "0.5rem" }}>
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
            <p style={{ marginTop: "0.5rem" }}>
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
  );
}
