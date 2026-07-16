import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { cached, CACHE_TAGS } from "@/lib/cache";
import { ROLE, boardAdminRole, boardIdFromRole } from "@/lib/auth/roles";

export interface RoleService {
  getUserRoles(userId: string): Promise<string[]>;
  isAdmin(userId: string): Promise<boolean>;
  isVerified(userId: string): Promise<boolean>;
  canManageBoard(userId: string, boardId: string): Promise<boolean>;
  listManagedBoardIds(userId: string): Promise<string[] | "all">;
}

export function createRoleService(prisma: PrismaClient): RoleService {
  async function fetchUserRoles(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { roles: true },
    });
    return user?.roles ?? [];
  }

  const service: RoleService = {
    async getUserRoles(userId: string): Promise<string[]> {
      if (!userId) return [];
      return cached(
        () => fetchUserRoles(userId),
        ["roles", userId],
        [CACHE_TAGS.userRoles(userId)]
      );
    },

    async isAdmin(userId: string): Promise<boolean> {
      const roles = await service.getUserRoles(userId);
      return roles.includes(ROLE.ADMIN);
    },

    async isVerified(userId: string): Promise<boolean> {
      const roles = await service.getUserRoles(userId);
      return roles.includes(ROLE.ADMIN) || roles.includes(ROLE.VERIFIED);
    },

    async canManageBoard(userId: string, boardId: string): Promise<boolean> {
      const roles = await service.getUserRoles(userId);
      return roles.includes(ROLE.ADMIN) || roles.includes(boardAdminRole(boardId));
    },

    async listManagedBoardIds(userId: string): Promise<string[] | "all"> {
      const roles = await service.getUserRoles(userId);
      if (roles.includes(ROLE.ADMIN)) return "all";
      return roles
        .map(boardIdFromRole)
        .filter((id): id is string => id !== null);
    },
  };

  return service;
}

export const roleService = createRoleService(defaultPrisma);
