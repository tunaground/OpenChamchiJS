import { prisma } from "@/lib/prisma";
import {
  RoleRepository,
  RoleData,
  RoleWithPermissions,
  PermissionRepository,
  PermissionData,
} from "@/lib/repositories/interfaces/role";

export const roleRepository: RoleRepository = {
  async findAll(): Promise<RoleData[]> {
    return prisma.role.findMany({
      orderBy: { name: "asc" },
    });
  },

  async findAllWithPermissions(): Promise<RoleWithPermissions[]> {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
          where: {
            permission: { deleted: false },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
    }));
  },

  async findById(id: string): Promise<RoleData | null> {
    return prisma.role.findUnique({
      where: { id },
    });
  },

  async findByIdWithPermissions(id: string): Promise<RoleWithPermissions | null> {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
          where: {
            permission: { deleted: false },
          },
        },
      },
    });

    if (!role) return null;

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        description: rp.permission.description,
      })),
    };
  },

  async findByName(name: string): Promise<RoleData | null> {
    return prisma.role.findUnique({
      where: { name },
    });
  },

  async create(data: { name: string; description?: string }): Promise<RoleData> {
    return prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  },

  async update(id: string, data: { name?: string; description?: string }): Promise<RoleData> {
    return prisma.role.update({
      where: { id },
      data,
    });
  },

  async delete(id: string): Promise<void> {
    await prisma.role.delete({
      where: { id },
    });
  },

  async addPermission(roleId: string, permissionId: string): Promise<void> {
    await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId,
      },
    });
  },

  async removePermission(roleId: string, permissionId: string): Promise<void> {
    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });
  },
};

export const permissionRepository: PermissionRepository = {
  async findAll(): Promise<PermissionData[]> {
    return prisma.permission.findMany({
      where: { deleted: false },
      orderBy: { name: "asc" },
    });
  },

  async findById(id: string): Promise<PermissionData | null> {
    return prisma.permission.findUnique({
      where: { id, deleted: false },
    });
  },

  async findByName(name: string): Promise<PermissionData | null> {
    return prisma.permission.findUnique({
      where: { name, deleted: false },
    });
  },

  async create(data: { name: string; description?: string }): Promise<PermissionData> {
    return prisma.permission.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
  },
};
