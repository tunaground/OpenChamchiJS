"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Pagination } from "@/components/Pagination";
import { PageLayout } from "@/components/layout";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";
import { ROLE, boardAdminRole } from "@/lib/auth/roles";

const Container = styled.div`
  padding: ${(props) => props.theme.containerPadding};
  max-width: ${(props) => props.theme.adminMaxWidth};
  margin: 0 auto;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    padding: ${(props) => props.theme.containerPadding};
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

const SearchForm = styled.form`
  display: flex;
  gap: 0.8rem;

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    width: 100%;
  }
`;

const SearchInput = styled.input`
  flex: 1;
  max-width: 30rem;
  padding: 0.8rem 1.2rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 1.4rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};

  @media (max-width: ${(props) => props.theme.breakpoint}) {
    max-width: none;
  }

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }
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

const SearchButton = styled(Button)`
  flex-shrink: 0;
  white-space: nowrap;
`;

const UserCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
`;

const UserCard = styled.div`
  background: ${(props) => props.theme.surface};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 8px;
  padding: 1.2rem;
`;

const CardUserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 1rem;
`;

const CardRoles = styled.div`
  margin-bottom: 1rem;
`;

const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 1.2rem;
`;

const Avatar = styled.div`
  width: 3.2rem;
  height: 3.2rem;
  border-radius: 50%;
  overflow: hidden;
  background: ${(props) => props.theme.surfaceHover};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span`
  font-weight: 500;
`;

const UserEmail = styled.span`
  font-size: 1.2rem;
  color: ${(props) => props.theme.textSecondary};
`;

const RoleBadge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.8rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border-radius: 4px;
  font-size: 1.2rem;
  margin-right: 0.4rem;
  margin-bottom: 0.4rem;
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

const DangerSmallButton = styled(SmallButton)`
  border-color: #dc2626;
  color: #dc2626;

  &:hover {
    background: #dc262610;
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
  max-width: 40rem;
`;

const ModalTitle = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 1.6rem;
  color: ${(props) => props.theme.textPrimary};
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.8rem;
  margin-top: 2.4rem;
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

const RoleSection = styled.div`
  margin-bottom: 1.6rem;
`;

const RoleSectionTitle = styled.div`
  font-size: 1.3rem;
  font-weight: 500;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 0.8rem;
`;

const RoleCheckboxList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-height: 24rem;
  overflow-y: auto;
`;

const RoleCheckbox = styled.label`
  display: flex;
  align-items: center;
  gap: 0.8rem;
  font-size: 1.4rem;
  color: ${(props) => props.theme.textPrimary};
  cursor: pointer;

  input {
    width: 1.6rem;
    height: 1.6rem;
  }
`;

const ErrorText = styled.span`
  color: #dc2626;
  font-size: 1.2rem;
  margin-top: 0.4rem;
  display: block;
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
        <Header>
          <Title>{labels.title}</Title>
        </Header>

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
            <UserCards>
              {users.map((user) => (
                <UserCard key={user.id}>
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
                    <UserInfo>
                      <UserName>{user.name || "Unknown"}</UserName>
                    </UserInfo>
                  </CardUserInfo>
                  <CardRoles>
                    {user.roles.map((role) => (
                      <RoleBadge key={role}>{role}</RoleBadge>
                    ))}
                  </CardRoles>
                  <CardActions>
                    <SmallButton onClick={() => openRolesModal(user)}>
                      {labels.editRoles}
                    </SmallButton>
                    {canDelete && (
                      <DangerSmallButton onClick={() => openDeleteModal(user)}>
                        {labels.delete}
                      </DangerSmallButton>
                    )}
                  </CardActions>
                </UserCard>
              ))}
            </UserCards>

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
              <p style={{ marginBottom: "1.6rem", fontWeight: 500 }}>
                {selectedUser.name}
              </p>

              <RoleSection>
                <RoleSectionTitle>{labels.globalRoles}</RoleSectionTitle>
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
                  <RoleSectionTitle>{labels.boardRoles}</RoleSectionTitle>
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
