import { PrismaClient } from "@prisma/client";
import { prisma as defaultPrisma } from "@/lib/prisma";

export interface PermissionService {
  getUserPermissions(userId: string): Promise<string[]>;
  hasPermission(userPermissions: string[], requiredPermission: string): boolean;
  hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean;
  checkUserPermission(userId: string, requiredPermission: string): Promise<boolean>;
  checkUserPermissions(userId: string, requiredPermissions: string[]): Promise<boolean>;
}

export function createPermissionService(prisma: PrismaClient): PermissionService {
  return {
    async getUserPermissions(userId: string): Promise<string[]> {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) return [];

      const permissions = new Set<string>();

      for (const userRole of user.userRoles) {
        for (const rolePermission of userRole.role.permissions) {
          permissions.add(rolePermission.permission.name);
        }
      }

      return Array.from(permissions);
    },

    hasPermission(userPermissions: string[], requiredPermission: string): boolean {
      if (userPermissions.includes("all:all")) {
        return true;
      }
      return userPermissions.includes(requiredPermission);
    },

    hasAnyPermission(userPermissions: string[], requiredPermissions: string[]): boolean {
      if (userPermissions.includes("all:all")) {
        return true;
      }
      return requiredPermissions.some((p) => userPermissions.includes(p));
    },

    async checkUserPermission(
      userId: string,
      requiredPermission: string
    ): Promise<boolean> {
      const permissions = await this.getUserPermissions(userId);
      return this.hasPermission(permissions, requiredPermission);
    },

    async checkUserPermissions(
      userId: string,
      requiredPermissions: string[]
    ): Promise<boolean> {
      const permissions = await this.getUserPermissions(userId);
      return this.hasAnyPermission(permissions, requiredPermissions);
    },
  };
}

export const permissionService = createPermissionService(defaultPrisma);
