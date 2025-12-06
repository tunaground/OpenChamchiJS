export interface PermissionData {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePermissionInput {
  name: string;
  description?: string;
}

export interface PermissionRepository {
  findByName(name: string): Promise<PermissionData | null>;
  create(data: CreatePermissionInput): Promise<PermissionData>;
  createMany(data: CreatePermissionInput[]): Promise<void>;
}
