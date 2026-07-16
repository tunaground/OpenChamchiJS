import {
  roleService as defaultRoleService,
  RoleService,
} from "@/lib/services/role";
import { ROLE, isBoardAdminRole } from "@/lib/auth/roles";
import { userRepository as defaultUserRepository } from "@/lib/repositories/prisma/user";
import { UserRepository, UserWithRoles } from "@/lib/repositories/interfaces/user";
import { ServiceError, ServiceErrorCode } from "@/lib/services/errors";
import { DEFAULT_USER_LIMIT } from "@/lib/types/pagination";
import { invalidateCache, CACHE_TAGS } from "@/lib/cache";

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
  setRoles(requesterId: string, userId: string, roles: string[]): Promise<void>;
  delete(requesterId: string, userId: string): Promise<void>;
  deleteSelf(userId: string): Promise<void>;
}

interface UserServiceDeps {
  userRepository: UserRepository;
  roleService: RoleService;
}

export function createUserService(deps: UserServiceDeps): UserService {
  const { userRepository, roleService } = deps;

  async function requireAdmin(requesterId: string): Promise<void> {
    if (!(await roleService.isAdmin(requesterId))) {
      throw new UserServiceError("Permission denied", "FORBIDDEN");
    }
  }

  return {
    async findAll(
      requesterId: string,
      options?: { page?: number; search?: string; limit?: number }
    ) {
      await requireAdmin(requesterId);

      const { page = 1, search, limit = DEFAULT_USER_LIMIT } = options || {};
      const offset = (page - 1) * limit;

      // Single transaction optimization
      const { data, total } = await userRepository.findAllWithCount({ limit, offset, search });

      return {
        data,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    },

    async findById(requesterId: string, id: string): Promise<UserWithRoles> {
      await requireAdmin(requesterId);

      const user = await userRepository.findById(id);
      if (!user) {
        throw new UserServiceError("User not found", "NOT_FOUND");
      }
      return user;
    },

    async setRoles(
      requesterId: string,
      userId: string,
      roles: string[]
    ): Promise<void> {
      await requireAdmin(requesterId);

      const invalid = roles.filter(
        (role) =>
          role !== ROLE.ADMIN &&
          role !== ROLE.VERIFIED &&
          !isBoardAdminRole(role)
      );
      if (invalid.length > 0) {
        throw new UserServiceError(`Invalid role: ${invalid[0]}`, "BAD_REQUEST");
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        throw new UserServiceError("User not found", "NOT_FOUND");
      }

      const nextRoles = [...new Set(roles)];

      if (
        requesterId === userId &&
        user.roles.includes(ROLE.ADMIN) &&
        !nextRoles.includes(ROLE.ADMIN)
      ) {
        throw new UserServiceError(
          "Cannot remove your own ADMIN role",
          "BAD_REQUEST"
        );
      }

      await userRepository.setRoles(userId, nextRoles);

      invalidateCache(CACHE_TAGS.userRoles(userId));
    },

    async delete(requesterId: string, userId: string): Promise<void> {
      await requireAdmin(requesterId);

      // Prevent self-deletion
      if (requesterId === userId) {
        throw new UserServiceError("Cannot delete yourself", "BAD_REQUEST");
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        throw new UserServiceError("User not found", "NOT_FOUND");
      }

      await userRepository.delete(userId);

      // Invalidate role cache for deleted user
      invalidateCache(CACHE_TAGS.userRoles(userId));
    },

    async deleteSelf(userId: string): Promise<void> {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new UserServiceError("User not found", "NOT_FOUND");
      }

      await userRepository.delete(userId);

      // Invalidate role cache for deleted user
      invalidateCache(CACHE_TAGS.userRoles(userId));
    },
  };
}

export const userService = createUserService({
  userRepository: defaultUserRepository,
  roleService: defaultRoleService,
});
