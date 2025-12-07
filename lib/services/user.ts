import {
  permissionService as defaultPermissionService,
  PermissionService,
} from "@/lib/services/permission";
import { userRepository as defaultUserRepository } from "@/lib/repositories/prisma/user";
import { roleRepository as defaultRoleRepository } from "@/lib/repositories/prisma/role";
import { UserRepository, UserWithRoles } from "@/lib/repositories/interfaces/user";
import { RoleRepository, RoleData } from "@/lib/repositories/interfaces/role";
import { ServiceError, ServiceErrorCode } from "@/lib/services/errors";
import { DEFAULT_USER_LIMIT } from "@/lib/types/pagination";

export class UserServiceError extends ServiceError {
  constructor(
    message: string,
    code: ServiceErrorCode
  ) {
    super(message, code);
    this.name = "UserServiceError";
  }
}

export interface UserService {
  findAll(
    requesterId: string,
    options?: { page?: number; search?: string; limit?: number }
  ): Promise<{
    data: UserWithRoles[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>;
  findById(requesterId: string, id: string): Promise<UserWithRoles>;
  getAllRoles(requesterId: string): Promise<RoleData[]>;
  addRole(requesterId: string, userId: string, roleId: string): Promise<void>;
  removeRole(requesterId: string, userId: string, roleId: string): Promise<void>;
  delete(requesterId: string, userId: string): Promise<void>;
  deleteSelf(userId: string): Promise<void>;
}

interface UserServiceDeps {
  userRepository: UserRepository;
  roleRepository: RoleRepository;
  permissionService: PermissionService;
}

export function createUserService(deps: UserServiceDeps): UserService {
  const { userRepository, roleRepository, permissionService } = deps;

  async function checkPermission(
    requesterId: string,
    permission: string
  ): Promise<void> {
    const hasPermission = await permissionService.checkUserPermission(
      requesterId,
      permission
    );
    if (!hasPermission) {
      throw new UserServiceError("Permission denied", "FORBIDDEN");
    }
  }

  return {
    async findAll(
      requesterId: string,
      options?: { page?: number; search?: string; limit?: number }
    ) {
      await checkPermission(requesterId, "user:read");

      const { page = 1, search, limit = DEFAULT_USER_LIMIT } = options || {};
      const offset = (page - 1) * limit;

      const [users, total] = await Promise.all([
        userRepository.findAll({ limit, offset, search }),
        userRepository.count(search),
      ]);

      return {
        data: users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },

    async findById(requesterId: string, id: string): Promise<UserWithRoles> {
      await checkPermission(requesterId, "user:read");

      const user = await userRepository.findById(id);
      if (!user) {
        throw new UserServiceError("User not found", "NOT_FOUND");
      }
      return user;
    },

    async getAllRoles(requesterId: string): Promise<RoleData[]> {
      await checkPermission(requesterId, "user:read");
      return roleRepository.findAll();
    },

    async addRole(
      requesterId: string,
      userId: string,
      roleId: string
    ): Promise<void> {
      await checkPermission(requesterId, "user:update");

      const user = await userRepository.findById(userId);
      if (!user) {
        throw new UserServiceError("User not found", "NOT_FOUND");
      }

      const role = await roleRepository.findById(roleId);
      if (!role) {
        throw new UserServiceError("Role not found", "NOT_FOUND");
      }

      // Check if user already has this role
      if (user.roles.some((r) => r.id === roleId)) {
        throw new UserServiceError("User already has this role", "BAD_REQUEST");
      }

      await userRepository.addRole(userId, roleId);
    },

    async removeRole(
      requesterId: string,
      userId: string,
      roleId: string
    ): Promise<void> {
      await checkPermission(requesterId, "user:update");

      const user = await userRepository.findById(userId);
      if (!user) {
        throw new UserServiceError("User not found", "NOT_FOUND");
      }

      // Check if user has this role
      if (!user.roles.some((r) => r.id === roleId)) {
        throw new UserServiceError("User does not have this role", "BAD_REQUEST");
      }

      await userRepository.removeRole(userId, roleId);
    },

    async delete(requesterId: string, userId: string): Promise<void> {
      await checkPermission(requesterId, "user:delete");

      // Prevent self-deletion
      if (requesterId === userId) {
        throw new UserServiceError("Cannot delete yourself", "BAD_REQUEST");
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        throw new UserServiceError("User not found", "NOT_FOUND");
      }

      await userRepository.delete(userId);
    },

    async deleteSelf(userId: string): Promise<void> {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new UserServiceError("User not found", "NOT_FOUND");
      }

      await userRepository.delete(userId);
    },
  };
}

export const userService = createUserService({
  userRepository: defaultUserRepository,
  roleRepository: defaultRoleRepository,
  permissionService: defaultPermissionService,
});
