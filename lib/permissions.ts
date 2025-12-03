import { prisma } from "@/lib/prisma";

export async function getUserPermissions(userId: string): Promise<string[]> {
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
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  // all:all grants all permissions
  if (userPermissions.includes("all:all")) {
    return true;
  }

  return userPermissions.includes(requiredPermission);
}

export async function checkUserPermission(
  userId: string,
  requiredPermission: string
): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return hasPermission(permissions, requiredPermission);
}
