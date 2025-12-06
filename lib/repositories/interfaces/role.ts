export interface PermissionData {
  id: string;
  name: string;
  description: string | null;
}

export interface RoleData {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleWithPermissions extends RoleData {
  permissions: PermissionData[];
}

export interface RoleRepository {
  findAll(): Promise<RoleData[]>;
  findAllWithPermissions(): Promise<RoleWithPermissions[]>;
  findById(id: string): Promise<RoleData | null>;
  findByIdWithPermissions(id: string): Promise<RoleWithPermissions | null>;
  findByName(name: string): Promise<RoleData | null>;
  create(data: { name: string; description?: string }): Promise<RoleData>;
  update(id: string, data: { name?: string; description?: string }): Promise<RoleData>;
  delete(id: string): Promise<void>;
  addPermission(roleId: string, permissionId: string): Promise<void>;
  removePermission(roleId: string, permissionId: string): Promise<void>;
}

export interface PermissionRepository {
  findAll(): Promise<PermissionData[]>;
  findById(id: string): Promise<PermissionData | null>;
  findByName(name: string): Promise<PermissionData | null>;
  create(data: { name: string; description?: string }): Promise<PermissionData>;
}
