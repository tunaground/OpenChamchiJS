import { prisma } from "@/lib/prisma";
import {
  UserRepository,
  UserWithRoles,
  FindAllWithCountResult,
} from "@/lib/repositories/interfaces/user";
import { DEFAULT_USER_LIMIT } from "@/lib/types/pagination";

export const userRepository: UserRepository = {
  async findAll(options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<UserWithRoles[]> {
    const { limit = DEFAULT_USER_LIMIT, offset = 0, search } = options || {};

    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { id: "asc" },
      take: limit,
      skip: offset,
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
    }));
  },

  async findById(id: string): Promise<UserWithRoles | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
    };
  },

  async findUserIdsByRoleId(roleId: string): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true },
    });
    return userRoles.map((ur) => ur.userId);
  },

  async findAllWithCount(options?: {
    limit?: number;
    offset?: number;
    search?: string;
  }): Promise<FindAllWithCountResult> {
    const { limit = DEFAULT_USER_LIMIT, offset = 0, search } = options || {};

    const whereClause = search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    // Single transaction for both queries (reduces round trips)
    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: whereClause,
        include: {
          userRoles: {
            include: {
              role: {
                select: { id: true, name: true },
              },
            },
          },
        },
        orderBy: { id: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.user.count({ where: whereClause }),
    ]);

    const data = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      roles: user.userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
      })),
    }));

    return { data, total };
  },

  async count(search?: string): Promise<number> {
    return prisma.user.count({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
    });
  },

  async addRole(userId: string, roleId: string): Promise<void> {
    await prisma.userRole.create({
      data: {
        userId,
        roleId,
      },
    });
  },

  async removeRole(userId: string, roleId: string): Promise<void> {
    await prisma.userRole.deleteMany({
      where: {
        userId,
        roleId,
      },
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  },
};
