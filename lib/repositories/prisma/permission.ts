import { prisma } from "@/lib/prisma";
import {
  PermissionRepository,
  PermissionData,
  CreatePermissionInput,
} from "@/lib/repositories/interfaces/permission";

export const permissionRepository: PermissionRepository = {
  async findByName(name: string): Promise<PermissionData | null> {
    return prisma.permission.findUnique({ where: { name } });
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
};
