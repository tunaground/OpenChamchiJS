"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { Pagination } from "@/components/Pagination";
import { PageLayout, AdminButton, AuthButton, ThemeToggleButton } from "@/components/layout";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";

const Container = styled.div`
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

const SearchForm = styled.form`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  padding: 0.5rem 0.75rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  font-size: 0.875rem;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};
  width: 300px;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
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
  vertical-align: middle;
`;

const UserCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
  background: ${(props) => props.theme.surfaceHover};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
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
  font-size: 0.75rem;
  color: ${(props) => props.theme.textSecondary};
`;

const RoleBadge = styled.span`
  display: inline-block;
  padding: 0.125rem 0.5rem;
  background: ${(props) => props.theme.buttonPrimary};
  color: ${(props) => props.theme.buttonPrimaryText};
  border-radius: 4px;
  font-size: 0.75rem;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
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

const DangerSmallButton = styled(SmallButton)`
  border-color: #dc2626;
  color: #dc2626;

  &:hover {
    background: #dc262610;
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
  max-width: 400px;
`;

const ModalTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: ${(props) => props.theme.textPrimary};
`;

const ModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.5rem;
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

const RoleList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const RoleItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: ${(props) => props.theme.surfaceHover};
  border-radius: 4px;
`;

const Select = styled.select`
  padding: 0.5rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};
  font-size: 0.875rem;
  width: 100%;
  margin-bottom: 0.5rem;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }
`;

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  roles: { id: string; name: string }[];
}

interface RoleData {
  id: string;
  name: string;
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
  roles?: string;
  settings?: string;
}

interface Labels {
  title: string;
  name: string;
  email: string;
  roles: string;
  actions: string;
  editRoles: string;
  delete: string;
  noUsers: string;
  noResults: string;
  searchPlaceholder: string;
  searchButton: string;
  confirmDelete: string;
  cancel: string;
  save: string;
  addRole: string;
  removeRole: string;
}

interface AdminUsersContentProps {
  users: UserData[];
  allRoles: RoleData[];
  pagination: PaginationData;
  search: string;
  authLabels: AuthLabels;
  sidebarLabels: SidebarLabels;
  canUpdate: boolean;
  canDelete: boolean;
  labels: Labels;
}

type ModalType = "editRoles" | "delete" | null;

export function AdminUsersContent({
  users: initialUsers,
  allRoles,
  pagination,
  search: initialSearch,
  authLabels,
  sidebarLabels,
  canUpdate,
  canDelete,
  labels,
}: AdminUsersContentProps) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("search", searchQuery);
    router.push(`/admin/users?${params.toString()}`);
  };

  const openEditRolesModal = (user: UserData) => {
    setSelectedUser(user);
    setSelectedRoleId("");
    setModalType("editRoles");
  };

  const openDeleteModal = (user: UserData) => {
    setSelectedUser(user);
    setModalType("delete");
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedUser(null);
    setSelectedRoleId("");
  };

  const handleAddRole = async () => {
    if (!selectedUser || !selectedRoleId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: selectedRoleId }),
      });

      if (res.ok) {
        const role = allRoles.find((r) => r.id === selectedRoleId);
        if (role) {
          const updatedUser = {
            ...selectedUser,
            roles: [...selectedUser.roles, { id: role.id, name: role.name }],
          };
          setSelectedUser(updatedUser);
          setUsers(users.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
          setSelectedRoleId("");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (roleId: string) => {
    if (!selectedUser) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/${selectedUser.id}/roles?roleId=${roleId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        const updatedUser = {
          ...selectedUser,
          roles: selectedUser.roles.filter((r) => r.id !== roleId),
        };
        setSelectedUser(updatedUser);
        setUsers(users.map((u) => (u.id === selectedUser.id ? updatedUser : u)));
      }
    } finally {
      setLoading(false);
    }
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

  const availableRoles = selectedUser
    ? allRoles.filter((r) => !selectedUser.roles.some((ur) => ur.id === r.id))
    : [];

  const sidebar = <AdminSidebar labels={sidebarLabels} />;
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

  const buildBaseUrl = () => {
    const params = new URLSearchParams();
    if (initialSearch) params.set("search", initialSearch);
    return `/admin/users?${params.toString()}`;
  };

  return (
    <PageLayout title={labels.title} sidebar={sidebar} rightContent={rightContent}>
      <Container>
        <Header>
          <Title>{labels.title}</Title>
        </Header>

        <SearchForm onSubmit={handleSearch}>
          <SearchInput
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={labels.searchPlaceholder}
          />
          <SearchButton type="submit">{labels.searchButton}</SearchButton>
        </SearchForm>

        {users.length === 0 ? (
          <EmptyState>
            {initialSearch ? labels.noResults : labels.noUsers}
          </EmptyState>
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>{labels.name}</Th>
                  <Th>{labels.roles}</Th>
                  <Th>{labels.actions}</Th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <Td>
                      <UserCell>
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
                          <UserEmail>{user.email}</UserEmail>
                        </UserInfo>
                      </UserCell>
                    </Td>
                    <Td>
                      {user.roles.map((role) => (
                        <RoleBadge key={role.id}>{role.name}</RoleBadge>
                      ))}
                    </Td>
                    <Td>
                      <ActionButtons>
                        {canUpdate && (
                          <SmallButton onClick={() => openEditRolesModal(user)}>
                            {labels.editRoles}
                          </SmallButton>
                        )}
                        {canDelete && (
                          <DangerSmallButton onClick={() => openDeleteModal(user)}>
                            {labels.delete}
                          </DangerSmallButton>
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
              baseUrl={buildBaseUrl()}
            />
          </>
        )}

        {/* Edit Roles Modal */}
        {modalType === "editRoles" && selectedUser && (
          <Modal onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>
                {labels.editRoles} - {selectedUser.name}
              </ModalTitle>

              <RoleList>
                {selectedUser.roles.map((role) => (
                  <RoleItem key={role.id}>
                    <span>{role.name}</span>
                    <SmallButton
                      onClick={() => handleRemoveRole(role.id)}
                      disabled={loading}
                    >
                      {labels.removeRole}
                    </SmallButton>
                  </RoleItem>
                ))}
              </RoleList>

              {availableRoles.length > 0 && (
                <>
                  <div style={{ marginTop: "1rem" }}>
                    <Select
                      value={selectedRoleId}
                      onChange={(e) => setSelectedRoleId(e.target.value)}
                    >
                      <option value="">-- Select Role --</option>
                      {availableRoles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </Select>
                    <Button
                      onClick={handleAddRole}
                      disabled={!selectedRoleId || loading}
                    >
                      {labels.addRole}
                    </Button>
                  </div>
                </>
              )}

              <ModalActions>
                <SecondaryButton onClick={closeModal}>
                  {labels.cancel}
                </SecondaryButton>
              </ModalActions>
            </ModalContent>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        {modalType === "delete" && selectedUser && (
          <Modal onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>{labels.delete}</ModalTitle>
              <p>{labels.confirmDelete}</p>
              <p style={{ marginTop: "0.5rem", fontWeight: 500 }}>
                {selectedUser.name} ({selectedUser.email})
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
