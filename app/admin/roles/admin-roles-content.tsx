"use client";

import { useState } from "react";
import styled from "styled-components";
import { PageLayout, AdminButton, AuthButton, ThemeToggleButton, HomeButton } from "@/components/layout";
import { AdminSidebar } from "@/components/sidebar/AdminSidebar";

const Container = styled.div`
  padding: 3.2rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3.2rem;
`;

const Title = styled.h1`
  font-size: 2.4rem;
  font-weight: 600;
  color: ${(props) => props.theme.textPrimary};
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
  vertical-align: top;
`;

const PermissionBadge = styled.span`
  display: inline-block;
  padding: 0.2rem 0.8rem;
  background: ${(props) => props.theme.surfaceHover};
  color: ${(props) => props.theme.textPrimary};
  border: 1px solid ${(props) => props.theme.surfaceBorder};
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

const CreateButton = styled.button`
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
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
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

const FormGroup = styled.div`
  margin-bottom: 1.6rem;
`;

const Label = styled.label`
  display: block;
  font-size: 1.4rem;
  font-weight: 500;
  margin-bottom: 0.8rem;
  color: ${(props) => props.theme.textPrimary};
`;

const Input = styled.input`
  width: 100%;
  padding: 0.8rem 1.2rem;
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

const PermissionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-height: 300px;
  overflow-y: auto;
`;

const PermissionItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  background: ${(props) => props.theme.surfaceHover};
  border-radius: 4px;
`;

const Select = styled.select`
  padding: 0.8rem;
  border: 1px solid ${(props) => props.theme.surfaceBorder};
  border-radius: 4px;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.textPrimary};
  font-size: 1.4rem;
  width: 100%;
  margin-bottom: 0.8rem;

  &:focus {
    outline: none;
    border-color: ${(props) => props.theme.textSecondary};
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 0.8rem;
  color: ${(props) => props.theme.textSecondary};
`;

interface PermissionData {
  id: string;
  name: string;
  description: string | null;
}

interface RoleData {
  id: string;
  name: string;
  description: string | null;
  permissions: PermissionData[];
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
  description: string;
  permissions: string;
  actions: string;
  edit: string;
  editPermissions: string;
  delete: string;
  noRoles: string;
  createRole: string;
  createTitle: string;
  editTitle: string;
  confirmDelete: string;
  cancel: string;
  save: string;
  create: string;
  addPermission: string;
  removePermission: string;
  noPermissions: string;
}

interface AdminRolesContentProps {
  roles: RoleData[];
  allPermissions: PermissionData[];
  authLabels: AuthLabels;
  sidebarLabels: SidebarLabels;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  labels: Labels;
}

type ModalType = "create" | "edit" | "editPermissions" | "delete" | null;

export function AdminRolesContent({
  roles: initialRoles,
  allPermissions,
  authLabels,
  sidebarLabels,
  canCreate,
  canUpdate,
  canDelete,
  labels,
}: AdminRolesContentProps) {
  const [roles, setRoles] = useState(initialRoles);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedPermissionId, setSelectedPermissionId] = useState("");
  const [loading, setLoading] = useState(false);

  const openCreateModal = () => {
    setFormName("");
    setFormDescription("");
    setModalType("create");
  };

  const openEditModal = (role: RoleData) => {
    setSelectedRole(role);
    setFormName(role.name);
    setFormDescription(role.description || "");
    setModalType("edit");
  };

  const openEditPermissionsModal = (role: RoleData) => {
    setSelectedRole(role);
    setSelectedPermissionId("");
    setModalType("editPermissions");
  };

  const openDeleteModal = (role: RoleData) => {
    setSelectedRole(role);
    setModalType("delete");
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedRole(null);
    setFormName("");
    setFormDescription("");
    setSelectedPermissionId("");
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        }),
      });

      if (res.ok) {
        const newRole = await res.json();
        setRoles([...roles, { ...newRole, permissions: [] }]);
        closeModal();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedRole || !formName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/roles/${selectedRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDescription.trim() || null,
        }),
      });

      if (res.ok) {
        setRoles(
          roles.map((r) =>
            r.id === selectedRole.id
              ? {
                  ...r,
                  name: formName.trim(),
                  description: formDescription.trim() || null,
                }
              : r
          )
        );
        closeModal();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/roles/${selectedRole.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setRoles(roles.filter((r) => r.id !== selectedRole.id));
        closeModal();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddPermission = async () => {
    if (!selectedRole || !selectedPermissionId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/roles/${selectedRole.id}/permissions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissionId: selectedPermissionId }),
      });

      if (res.ok) {
        const permission = allPermissions.find(
          (p) => p.id === selectedPermissionId
        );
        if (permission) {
          const updatedRole = {
            ...selectedRole,
            permissions: [...selectedRole.permissions, permission],
          };
          setSelectedRole(updatedRole);
          setRoles(
            roles.map((r) => (r.id === selectedRole.id ? updatedRole : r))
          );
          setSelectedPermissionId("");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePermission = async (permissionId: string) => {
    if (!selectedRole) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/roles/${selectedRole.id}/permissions?permissionId=${permissionId}`,
        { method: "DELETE" }
      );

      if (res.ok) {
        const updatedRole = {
          ...selectedRole,
          permissions: selectedRole.permissions.filter(
            (p) => p.id !== permissionId
          ),
        };
        setSelectedRole(updatedRole);
        setRoles(
          roles.map((r) => (r.id === selectedRole.id ? updatedRole : r))
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const availablePermissions = selectedRole
    ? allPermissions.filter(
        (p) => !selectedRole.permissions.some((rp) => rp.id === p.id)
      )
    : [];

  const sidebar = <AdminSidebar labels={sidebarLabels} />;
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
    <PageLayout
      title={labels.title}
      sidebar={sidebar}
      rightContent={rightContent}
    >
      <Container>
        <Header>
          <Title>{labels.title}</Title>
          {canCreate && (
            <CreateButton onClick={openCreateModal}>
              {labels.createRole}
            </CreateButton>
          )}
        </Header>

        {roles.length === 0 ? (
          <EmptyState>{labels.noRoles}</EmptyState>
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>{labels.name}</Th>
                <Th>{labels.description}</Th>
                <Th>{labels.permissions}</Th>
                <Th>{labels.actions}</Th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id}>
                  <Td style={{ fontWeight: 500 }}>{role.name}</Td>
                  <Td>{role.description || "-"}</Td>
                  <Td>
                    {role.permissions.length === 0 ? (
                      <span style={{ color: "gray" }}>
                        {labels.noPermissions}
                      </span>
                    ) : (
                      role.permissions.map((p) => (
                        <PermissionBadge key={p.id}>{p.name}</PermissionBadge>
                      ))
                    )}
                  </Td>
                  <Td>
                    <ActionButtons>
                      {canUpdate && (
                        <>
                          <SmallButton onClick={() => openEditModal(role)}>
                            {labels.edit}
                          </SmallButton>
                          <SmallButton
                            onClick={() => openEditPermissionsModal(role)}
                          >
                            {labels.editPermissions}
                          </SmallButton>
                        </>
                      )}
                      {canDelete && (
                        <DangerSmallButton
                          onClick={() => openDeleteModal(role)}
                        >
                          {labels.delete}
                        </DangerSmallButton>
                      )}
                    </ActionButtons>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* Create Modal */}
        {modalType === "create" && (
          <Modal onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>{labels.createTitle}</ModalTitle>
              <FormGroup>
                <Label>{labels.name}</Label>
                <Input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="ROLE_NAME"
                />
              </FormGroup>
              <FormGroup>
                <Label>{labels.description}</Label>
                <Input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Role description"
                />
              </FormGroup>
              <ModalActions>
                <SecondaryButton onClick={closeModal} disabled={loading}>
                  {labels.cancel}
                </SecondaryButton>
                <Button
                  onClick={handleCreate}
                  disabled={!formName.trim() || loading}
                >
                  {labels.create}
                </Button>
              </ModalActions>
            </ModalContent>
          </Modal>
        )}

        {/* Edit Modal */}
        {modalType === "edit" && selectedRole && (
          <Modal onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>{labels.editTitle}</ModalTitle>
              <FormGroup>
                <Label>{labels.name}</Label>
                <Input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label>{labels.description}</Label>
                <Input
                  type="text"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </FormGroup>
              <ModalActions>
                <SecondaryButton onClick={closeModal} disabled={loading}>
                  {labels.cancel}
                </SecondaryButton>
                <Button
                  onClick={handleUpdate}
                  disabled={!formName.trim() || loading}
                >
                  {labels.save}
                </Button>
              </ModalActions>
            </ModalContent>
          </Modal>
        )}

        {/* Edit Permissions Modal */}
        {modalType === "editPermissions" && selectedRole && (
          <Modal onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>
                {labels.editPermissions} - {selectedRole.name}
              </ModalTitle>

              <SectionTitle>{labels.permissions}</SectionTitle>
              <PermissionList>
                {selectedRole.permissions.length === 0 ? (
                  <div style={{ color: "gray", padding: "0.8rem" }}>
                    {labels.noPermissions}
                  </div>
                ) : (
                  selectedRole.permissions.map((permission) => (
                    <PermissionItem key={permission.id}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{permission.name}</div>
                        {permission.description && (
                          <div
                            style={{ fontSize: "1.2rem", color: "gray" }}
                          >
                            {permission.description}
                          </div>
                        )}
                      </div>
                      <SmallButton
                        onClick={() => handleRemovePermission(permission.id)}
                        disabled={loading}
                      >
                        {labels.removePermission}
                      </SmallButton>
                    </PermissionItem>
                  ))
                )}
              </PermissionList>

              {availablePermissions.length > 0 && (
                <div style={{ marginTop: "1.6rem" }}>
                  <SectionTitle>{labels.addPermission}</SectionTitle>
                  <Select
                    value={selectedPermissionId}
                    onChange={(e) => setSelectedPermissionId(e.target.value)}
                  >
                    <option value="">-- Select Permission --</option>
                    {availablePermissions.map((permission) => (
                      <option key={permission.id} value={permission.id}>
                        {permission.name}
                        {permission.description
                          ? ` - ${permission.description}`
                          : ""}
                      </option>
                    ))}
                  </Select>
                  <Button
                    onClick={handleAddPermission}
                    disabled={!selectedPermissionId || loading}
                  >
                    {labels.addPermission}
                  </Button>
                </div>
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
        {modalType === "delete" && selectedRole && (
          <Modal onClick={closeModal}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>{labels.delete}</ModalTitle>
              <p>{labels.confirmDelete}</p>
              <p style={{ marginTop: "0.8rem", fontWeight: 500 }}>
                {selectedRole.name}
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
