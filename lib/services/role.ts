import { roleRepository, permissionRepository } from "@/lib/repositories/prisma/role";
import { userRepository } from "@/lib/repositories/prisma/user";
import { permissionService } from "./permission";
import {
  RoleData,
  RoleWithPermissions,
  PermissionData,
} from "@/lib/repositories/interfaces/role";
import { ServiceError, ServiceErrorCode } from "@/lib/services/errors";
import { invalidateCache, CACHE_TAGS } from "@/lib/cache";

export class RoleServiceError extends ServiceError {
  constructor(
    message: string,
    code: ServiceErrorCode
  ) {
    super(message, code);
    this.name = "RoleServiceError";
  }
}

export interface RoleService {
  findAll(requesterId: string): Promise<RoleWithPermissions[]>;
  findById(requesterId: string, roleId: string): Promise<RoleWithPermissions>;
  create(
    requesterId: string,
    data: { name: string; description?: string }
  ): Promise<RoleData>;
  update(
    requesterId: string,
    roleId: string,
    data: { name?: string; description?: string }
  ): Promise<RoleData>;
  delete(requesterId: string, roleId: string): Promise<void>;
  addPermission(
    requesterId: string,
    roleId: string,
    permissionId: string
  ): Promise<void>;
  removePermission(
    requesterId: string,
    roleId: string,
    permissionId: string
  ): Promise<void>;
  getAllPermissions(requesterId: string): Promise<PermissionData[]>;
}

export const roleService: RoleService = {
  async findAll(requesterId: string): Promise<RoleWithPermissions[]> {
    const canRead = await permissionService.checkUserPermission(
      requesterId,
      "role:read"
    );
    if (!canRead) {
      throw new RoleServiceError("Permission denied", "FORBIDDEN");
    }

    return roleRepository.findAllWithPermissions();
  },

  async findById(requesterId: string, roleId: string): Promise<RoleWithPermissions> {
    const canRead = await permissionService.checkUserPermission(
      requesterId,
      "role:read"
    );
    if (!canRead) {
      throw new RoleServiceError("Permission denied", "FORBIDDEN");
    }

    const role = await roleRepository.findByIdWithPermissions(roleId);
    if (!role) {
      throw new RoleServiceError("Role not found", "NOT_FOUND");
    }

    return role;
  },

  async create(
    requesterId: string,
    data: { name: string; description?: string }
  ): Promise<RoleData> {
    const canCreate = await permissionService.checkUserPermission(
      requesterId,
      "role:create"
    );
    if (!canCreate) {
      throw new RoleServiceError("Permission denied", "FORBIDDEN");
    }

    const existing = await roleRepository.findByName(data.name);
    if (existing) {
      throw new RoleServiceError("Role name already exists", "BAD_REQUEST");
    }

    return roleRepository.create(data);
  },

  async update(
    requesterId: string,
    roleId: string,
    data: { name?: string; description?: string }
  ): Promise<RoleData> {
    const canUpdate = await permissionService.checkUserPermission(
      requesterId,
      "role:update"
    );
    if (!canUpdate) {
      throw new RoleServiceError("Permission denied", "FORBIDDEN");
    }

    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new RoleServiceError("Role not found", "NOT_FOUND");
    }

    if (data.name && data.name !== role.name) {
      const existing = await roleRepository.findByName(data.name);
      if (existing) {
        throw new RoleServiceError("Role name already exists", "BAD_REQUEST");
      }
    }

    return roleRepository.update(roleId, data);
  },

  async delete(requesterId: string, roleId: string): Promise<void> {
    const canDelete = await permissionService.checkUserPermission(
      requesterId,
      "role:delete"
    );
    if (!canDelete) {
      throw new RoleServiceError("Permission denied", "FORBIDDEN");
    }

    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new RoleServiceError("Role not found", "NOT_FOUND");
    }

    // Get all users with this role before deleting
    const userIds = await userRepository.findUserIdsByRoleId(roleId);

    await roleRepository.delete(roleId);

    // Invalidate permission cache for all affected users
    for (const userId of userIds) {
      invalidateCache(CACHE_TAGS.userPermissions(userId));
    }
  },

  async addPermission(
    requesterId: string,
    roleId: string,
    permissionId: string
  ): Promise<void> {
    const canUpdate = await permissionService.checkUserPermission(
      requesterId,
      "role:update"
    );
    if (!canUpdate) {
      throw new RoleServiceError("Permission denied", "FORBIDDEN");
    }

    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new RoleServiceError("Role not found", "NOT_FOUND");
    }

    const permission = await permissionRepository.findById(permissionId);
    if (!permission) {
      throw new RoleServiceError("Permission not found", "NOT_FOUND");
    }

    await roleRepository.addPermission(roleId, permissionId);

    // Invalidate permission cache for all users with this role
    const userIds = await userRepository.findUserIdsByRoleId(roleId);
    for (const userId of userIds) {
      invalidateCache(CACHE_TAGS.userPermissions(userId));
    }
  },

  async removePermission(
    requesterId: string,
    roleId: string,
    permissionId: string
  ): Promise<void> {
    const canUpdate = await permissionService.checkUserPermission(
      requesterId,
      "role:update"
    );
    if (!canUpdate) {
      throw new RoleServiceError("Permission denied", "FORBIDDEN");
    }

    const role = await roleRepository.findById(roleId);
    if (!role) {
      throw new RoleServiceError("Role not found", "NOT_FOUND");
    }

    await roleRepository.removePermission(roleId, permissionId);

    // Invalidate permission cache for all users with this role
    const userIds = await userRepository.findUserIdsByRoleId(roleId);
    for (const userId of userIds) {
      invalidateCache(CACHE_TAGS.userPermissions(userId));
    }
  },

  async getAllPermissions(requesterId: string): Promise<PermissionData[]> {
    const canRead = await permissionService.checkUserPermission(
      requesterId,
      "role:read"
    );
    if (!canRead) {
      throw new RoleServiceError("Permission denied", "FORBIDDEN");
    }

    return permissionRepository.findAll();
  },
};
