"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Pagination } from "@/components/Pagination";
import { PageLayout } from "@/components/layout";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";
import { formatDateTime } from "@/lib/utils/date-formatter";
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
  SearchForm,
  SearchInput,
  SearchButton,
  Modal,
  ModalContent,
  ModalTitle,
  FormGroup,
  Label,
  Input,
  Textarea,
  Checkbox,
  ModalActions,
} from "../_components/admin-ui";

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
  boards: string;
  users: string;
  settings: string;
  globalNotices: string;
}

interface AdminGlobalNoticesContentProps {
  authLabels: AuthLabels;
  sidebarLabels: SidebarLabels;
  notices: NoticeData[];
  pagination: PaginationData;
  search: string;
  isAdmin: boolean;
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

export function AdminGlobalNoticesContent({
  authLabels,
  sidebarLabels,
  notices: initialNotices,
  pagination,
  search: initialSearch,
  isAdmin,
  canCreate,
  canUpdate,
  canDelete,
  labels,
}: AdminGlobalNoticesContentProps) {
  const router = useRouter();
  const locale = useLocale();
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
    router.push(`/admin/notices?${params.toString()}`);
  };

  const getBaseUrl = () => {
    const params = new URLSearchParams();
    if (initialSearch) {
      params.set("search", initialSearch);
    }
    const queryString = params.toString();
    return `/admin/notices${queryString ? `?${queryString}` : ""}`;
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
      const res = await fetch(`/api/notices`, {
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
      const res = await fetch(`/api/notices/${selectedNotice.id}`, {
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
      const res = await fetch(`/api/notices/${selectedNotice.id}`, {
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

  const sidebar = (
    <AdminSidebar labels={sidebarLabels} isAdmin={isAdmin} />
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
        <ActionsBar>
          {canCreate && (
            <Button type="button" onClick={openCreateModal}>{labels.createNotice}</Button>
          )}
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

      {notices.length === 0 ? (
        <EmptyState>
          {initialSearch ? labels.noResults : labels.noNotices}
        </EmptyState>
      ) : (
        <>
          <List>
            {notices.map((notice) => (
              <Item key={notice.id}>
                <ItemHeader>
                  <ItemTitle>{notice.title}</ItemTitle>
                  {notice.pinned && <Badge $tone="accent">{labels.pinned}</Badge>}
                </ItemHeader>
                <ItemMeta>{formatDateTime(notice.createdAt, locale)}</ItemMeta>
                <ItemActions>
                  {canUpdate && (
                    <SmallButton onClick={() => openEditModal(notice)}>
                      {labels.edit}
                    </SmallButton>
                  )}
                  {canDelete && (
                    <DangerSmallButton onClick={() => openDeleteModal(notice)}>
                      {labels.delete}
                    </DangerSmallButton>
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
