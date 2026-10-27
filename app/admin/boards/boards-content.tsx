"use client";

import { useState } from "react";
import Link from "next/link";
import { PageLayout } from "@/components/layout";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";
import {
  Container,
  ActionsBar,
  Button,
  SecondaryButton,
  DangerButton,
  Badge,
  List,
  Item,
  ItemHeader,
  ItemTitle,
  ItemMeta,
  ItemActions,
  SmallButton,
  DangerSmallButton,
  EmptyState,
  Modal,
  ModalContent,
  ModalTitle,
  FormGroup,
  Label,
  Input,
  ErrorText,
  Checkbox,
  ModalActions,
  Code as BoardId,
} from "../_components/admin-ui";

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
  writeLocked: boolean;
  showUserCount: boolean;
  uploadMaxSize: number;
  uploadMimeTypes: string;
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
  manageResponses: string;
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
  writeLocked: string;
  showUserCount: string;
  uploadMaxSize: string;
  uploadMaxSizePlaceholder: string;
  uploadMimeTypes: string;
  uploadMimeTypesPlaceholder: string;
  save: string;
  cancel: string;
  create: string;
  createTitle: string;
  editTitle: string;
  yes: string;
  no: string;
  required: string;
  fixThreadCount: string;
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
  settings: string;
  globalNotices: string;
}

interface BoardsContentProps {
  boards: BoardData[];
  authLabels: AuthLabels;
  sidebarLabels: SidebarLabels;
  isAdmin: boolean;
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
  writeLocked: boolean;
  showUserCount: boolean;
  uploadMaxSize: number;
  uploadMimeTypes: string;
}

const defaultFormData: FormData = {
  id: "",
  name: "",
  defaultUsername: "",
  threadsPerPage: 20,
  responsesPerPage: 50,
  maxResponsesPerThread: 1000,
  blockForeignIp: false,
  writeLocked: false,
  showUserCount: false,
  uploadMaxSize: 5,
  uploadMimeTypes: "image/png,image/jpeg,image/gif,image/webp",
};

export function BoardsContent({ boards: initialBoards, authLabels, sidebarLabels, isAdmin, canCreate, canUpdate, labels }: BoardsContentProps) {
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
      writeLocked: board.writeLocked,
      showUserCount: board.showUserCount,
      uploadMaxSize: Math.round(board.uploadMaxSize / (1024 * 1024)),
      uploadMimeTypes: board.uploadMimeTypes,
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
        body: JSON.stringify({
          ...formData,
          uploadMaxSize: formData.uploadMaxSize * 1024 * 1024,
        }),
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
          writeLocked: formData.writeLocked,
          showUserCount: formData.showUserCount,
          uploadMaxSize: formData.uploadMaxSize * 1024 * 1024,
          uploadMimeTypes: formData.uploadMimeTypes,
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

  const sidebar = <AdminSidebar labels={sidebarLabels} isAdmin={isAdmin} />;

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
        <ActionsBar>
          {canCreate && (
            <Button onClick={openCreateModal}>{labels.createBoard}</Button>
          )}
        </ActionsBar>

      {boards.length === 0 ? (
        <EmptyState>{labels.noBoards}</EmptyState>
      ) : (
        <List>
          {boards.map((board) => (
            <Item key={board.id}>
              <ItemHeader>
                <ItemTitle>
                  <BoardId>{board.id}</BoardId> {board.name}
                </ItemTitle>
                <Badge $tone={board.deleted ? "danger" : "success"}>
                  {board.deleted ? labels.deleted : labels.active}
                </Badge>
              </ItemHeader>
              <ItemMeta>
                <span>{labels.threads}: {board.threadCount}</span>
              </ItemMeta>
              <ItemActions>
                <Link prefetch={false} href={`/admin/boards/${board.id}/threads`}>
                  <SmallButton>{labels.manageThreads}</SmallButton>
                </Link>
                <Link prefetch={false} href={`/admin/boards/${board.id}/responses`}>
                  <SmallButton>{labels.manageResponses}</SmallButton>
                </Link>
                <Link prefetch={false} href={`/admin/boards/${board.id}/notices`}>
                  <SmallButton>{labels.manageNotices}</SmallButton>
                </Link>
                {canUpdate && (
                  <SmallButton
                    onClick={async () => {
                      const res = await fetch(`/api/boards/${board.id}/fix-count`, {
                        method: "POST",
                      });
                      if (res.ok) {
                        const { actual } = await res.json();
                        setBoards((prev) =>
                          prev.map((b) =>
                            b.id === board.id ? { ...b, threadCount: actual } : b
                          )
                        );
                      }
                    }}
                  >
                    {labels.fixThreadCount}
                  </SmallButton>
                )}
                {canUpdate && (
                  <SmallButton onClick={() => openEditModal(board)}>
                    {labels.edit}
                  </SmallButton>
                )}
                {canUpdate && !board.deleted && (
                  <DangerSmallButton onClick={() => openDeleteModal(board)}>
                    {labels.delete}
                  </DangerSmallButton>
                )}
                {canUpdate && board.deleted && (
                  <SmallButton onClick={() => openRestoreModal(board)}>
                    {labels.restore}
                  </SmallButton>
                )}
              </ItemActions>
            </Item>
          ))}
        </List>
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
                  checked={formData.writeLocked}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      writeLocked: e.target.checked,
                    })
                  }
                />
                <Label style={{ marginBottom: 0 }}>
                  {labels.writeLocked}
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

            <FormGroup>
              <Label>{labels.uploadMaxSize}</Label>
              <Input
                type="number"
                value={formData.uploadMaxSize}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    uploadMaxSize: parseInt(e.target.value) || 0,
                  })
                }
                placeholder={labels.uploadMaxSizePlaceholder}
                min={1}
              />
            </FormGroup>

            <FormGroup>
              <Label>{labels.uploadMimeTypes}</Label>
              <Input
                value={formData.uploadMimeTypes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    uploadMimeTypes: e.target.value,
                  })
                }
                placeholder={labels.uploadMimeTypesPlaceholder}
              />
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
