import { prisma } from "@/lib/prisma";
import {
  PermissionRepository,
  PermissionData,
  CreatePermissionInput,
} from "@/lib/repositories/interfaces/permission";

// Board-related permission patterns
function getBoardPermissionFilter(boardId: string) {
  return {
    OR: [
      { name: { startsWith: `board:${boardId}:` } },
      { name: { startsWith: `notice:${boardId}:` } },
      { name: { startsWith: `thread:${boardId}:` } },
      { name: { startsWith: `response:${boardId}:` } },
    ],
  };
}

export const permissionRepository: PermissionRepository = {
  async findByName(name: string): Promise<PermissionData | null> {
    return prisma.permission.findUnique({
      where: { name, deleted: false },
    });
  },

  async create(data: CreatePermissionInput): Promise<PermissionData> {
    return prisma.permission.create({ data });
  },

  async createMany(data: CreatePermissionInput[]): Promise<void> {
    await prisma.permission.createMany({
      data,
      skipDuplicates: true,
    });
  },

  async softDeleteByBoardId(boardId: string): Promise<void> {
    await prisma.permission.updateMany({
      where: getBoardPermissionFilter(boardId),
      data: { deleted: true },
    });
  },

  async restoreByBoardId(boardId: string): Promise<void> {
    await prisma.permission.updateMany({
      where: {
        ...getBoardPermissionFilter(boardId),
        deleted: true,
      },
      data: { deleted: false },
    });
  },
};
