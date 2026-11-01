"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Pagination } from "@/components/Pagination";
import { PageLayout } from "@/components/layout";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";
import { ROLE, boardAdminRole } from "@/lib/auth/roles";
import {
  Container,
  ActionsBar,
  Button,
  SecondaryButton,
  DangerButton,
  Badge,
  List,
  Item,
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
  ModalActions,
  ErrorText,
  SectionTitle,
} from "../_components/admin-ui";

const CardUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
`;

const CardRoles = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.8rem;

  &:empty {
    display: none;
  }
`;

const Avatar = styled.div`
  width: 3.2rem;
  height: 3.2rem;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  background: ${(props) => props.theme.hover};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 500;
  color: ${(props) => props.theme.textSecondary};
`;

const UserName = styled.span`
  font-size: 1.5rem;
  font-weight: 500;
  color: ${(props) => props.theme.textPrimary};
`;

const SelectedName = styled.p`
  margin-bottom: 1.6rem;
  font-weight: 500;
`;

const RoleSection = styled.div`
  margin-bottom: 1.6rem;
`;

const RoleCheckboxList = styled(List)`
  max-height: 24rem;
  overflow-y: auto;
`;

const RoleCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.9rem 1.2rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textPrimary};
  cursor: pointer;

  & + & {
    border-top: 1px solid ${(props) => props.theme.line};
  }

  &:hover {
    background: ${(props) => props.theme.hover};
  }

  input {
    width: 1.6rem;
    height: 1.6rem;
    accent-color: ${(props) => props.theme.accent};
  }
`;

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  roles: string[];
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
  admin: string;
  backToHome: string;
  boards: string;
  users: string;
  settings: string;
  globalNotices: string;
}

interface BoardOption {
  id: string;
  name: string;
}

interface Labels {
  title: string;
  name: string;
  email: string;
  actions: string;
  delete: string;
  noUsers: string;
  noResults: string;
  searchPlaceholder: string;
  searchButton: string;
  confirmDelete: string;
  cancel: string;
  editRoles: string;
  rolesTitle: string;
  globalRoles: string;
  boardRoles: string;
  save: string;
  saveError: string;
}

interface AdminUsersContentProps {
  users: UserData[];
  pagination: PaginationData;
  search: string;
  authLabels: AuthLabels;
  sidebarLabels: SidebarLabels;
  isAdmin: boolean;
  canDelete: boolean;
  boards: BoardOption[];
  labels: Labels;
}

type ModalType = "delete" | "roles" | null;

export function AdminUsersContent({
  users: initialUsers,
  pagination,
  search: initialSearch,
  authLabels,
  sidebarLabels,
  isAdmin,
  canDelete,
  boards,
  labels,
}: AdminUsersContentProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editRoles, setEditRoles] = useState<Set<string>>(new Set());
  const [rolesError, setRolesError] = useState<string | null>(null);
  const [savingRoles, setSavingRoles] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    router.push(`/admin/users?${params.toString()}`);
  };

  const openDeleteModal = (user: UserData) => {
    setSelectedUser(user);
    setModalType("delete");
  };

  const openRolesModal = (user: UserData) => {
    setSelectedUser(user);
    setEditRoles(new Set(user.roles));
    setRolesError(null);
    setModalType("roles");
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
    setRolesError(null);
  };

  const toggleRole = (role: string) => {
    setEditRoles((prev) => {
      const next = new Set(prev);
      if (next.has(role)) {
        next.delete(role);
      } else {
        next.add(role);
      }
      return next;
    });
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setUsers(users.filter((u) => u.id !== selectedUser.id));
        closeModal();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    setSavingRoles(true);
    setRolesError(null);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: Array.from(editRoles) }),
      });

      if (res.ok) {
        closeModal();
        router.refresh();
      } else {
        const data = await res.json().catch(() => null);
        setRolesError(
          typeof data?.error === "string" ? data.error : labels.saveError
        );
      }
    } finally {
      setSavingRoles(false);
    }
  };

  const sidebar = <AdminSidebar labels={sidebarLabels} isAdmin={isAdmin} />;

  const buildBaseUrl = () => {
    const params = new URLSearchParams();
    if (initialSearch) params.set("search", initialSearch);
    return `/admin/users?${params.toString()}`;
  };

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
          <SearchForm onSubmit={handleSearch}>
            <SearchInput
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={labels.searchPlaceholder}
            />
            <SearchButton type="submit">{labels.searchButton}</SearchButton>
          </SearchForm>
        </ActionsBar>

        {users.length === 0 ? (
          <EmptyState>
            {initialSearch ? labels.noResults : labels.noUsers}
          </EmptyState>
        ) : (
          <>
            <List>
              {users.map((user) => (
                <Item key={user.id}>
                  <CardUserInfo>
                    <Avatar>
                      {user.image ? (
                        <Image
                          src={user.image}
                          alt={user.name || ""}
                          width={32}
                          height={32}
                        />
                      ) : (
                        user.name?.charAt(0).toUpperCase() || "?"
                      )}
                    </Avatar>
                    <UserName>{user.name || "Unknown"}</UserName>
                  </CardUserInfo>
                  <CardRoles>
                    {user.roles.map((role) => (
                      <Badge key={role} $tone="accent">{role}</Badge>
                    ))}
                  </CardRoles>
                  <ItemActions>
                    <SmallButton onClick={() => openRolesModal(user)}>
                      {labels.editRoles}
                    </SmallButton>
                    {canDelete && (
                      <DangerSmallButton onClick={() => openDeleteModal(user)}>
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
              baseUrl={buildBaseUrl()}
            />
          </>
        )}

        {/* Delete Confirmation Modal */}
        {modalType === "delete" && selectedUser && (
          <Modal onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>{labels.delete}</ModalTitle>
              <p>{labels.confirmDelete}</p>
              <p style={{ marginTop: "0.8rem", fontWeight: 500 }}>
                {selectedUser.name}
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

        {/* Roles Modal */}
        {modalType === "roles" && selectedUser && (
          <Modal onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>{labels.rolesTitle}</ModalTitle>
              <SelectedName>{selectedUser.name}</SelectedName>

              <RoleSection>
                <SectionTitle>{labels.globalRoles}</SectionTitle>
                <RoleCheckboxList>
                  <RoleCheckbox>
                    <input
                      type="checkbox"
                      checked={editRoles.has(ROLE.ADMIN)}
                      onChange={() => toggleRole(ROLE.ADMIN)}
                    />
                    {ROLE.ADMIN}
                  </RoleCheckbox>
                  <RoleCheckbox>
                    <input
                      type="checkbox"
                      checked={editRoles.has(ROLE.VERIFIED)}
                      onChange={() => toggleRole(ROLE.VERIFIED)}
                    />
                    {ROLE.VERIFIED}
                  </RoleCheckbox>
                </RoleCheckboxList>
              </RoleSection>

              {boards.length > 0 && (
                <RoleSection>
                  <SectionTitle>{labels.boardRoles}</SectionTitle>
                  <RoleCheckboxList>
                    {boards.map((board) => {
                      const role = boardAdminRole(board.id);
                      return (
                        <RoleCheckbox key={board.id}>
                          <input
                            type="checkbox"
                            checked={editRoles.has(role)}
                            onChange={() => toggleRole(role)}
                          />
                          {board.name}
                        </RoleCheckbox>
                      );
                    })}
                  </RoleCheckboxList>
                </RoleSection>
              )}

              {rolesError && <ErrorText>{rolesError}</ErrorText>}

              <ModalActions>
                <SecondaryButton onClick={closeModal} disabled={savingRoles}>
                  {labels.cancel}
                </SecondaryButton>
                <Button onClick={handleSaveRoles} disabled={savingRoles}>
                  {labels.save}
                </Button>
              </ModalActions>
            </ModalContent>
          </Modal>
        )}
      </Container>
    </PageLayout>
  );
}
