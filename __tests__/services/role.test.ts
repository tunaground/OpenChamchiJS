import { roleService, RoleServiceError } from "@/lib/services/role";
import { roleRepository, permissionRepository } from "@/lib/repositories/prisma/role";
import { permissionService } from "@/lib/services/permission";

jest.mock("@/lib/repositories/prisma/role");
jest.mock("@/lib/services/permission");

const mockedRoleRepo = roleRepository as jest.Mocked<typeof roleRepository>;
const mockedPermissionRepo = permissionRepository as jest.Mocked<typeof permissionRepository>;
const mockedPermissionService = permissionService as jest.Mocked<typeof permissionService>;

describe("RoleService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockRole = {
    id: "role-1",
    name: "Test Role",
    description: "Test description",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRoleWithPermissions = {
    ...mockRole,
    permissions: [
      { id: "perm-1", name: "test:read", description: null },
    ],
  };

  const mockPermission = {
    id: "perm-1",
    name: "test:read",
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("findAll", () => {
    it("returns all roles with permissions when user has permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findAllWithPermissions.mockResolvedValue([mockRoleWithPermissions]);

      const result = await roleService.findAll("user-1");

      expect(result).toHaveLength(1);
      expect(result[0].permissions).toBeDefined();
    });

    it("throws FORBIDDEN when user lacks permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(false);

      await expect(roleService.findAll("user-1")).rejects.toThrow(
        "Permission denied"
      );
    });
  });

  describe("findById", () => {
    it("returns role with permissions when user has permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findByIdWithPermissions.mockResolvedValue(mockRoleWithPermissions);

      const result = await roleService.findById("user-1", "role-1");

      expect(result.id).toBe("role-1");
      expect(result.permissions).toBeDefined();
    });

    it("throws FORBIDDEN when user lacks permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(false);

      await expect(roleService.findById("user-1", "role-1")).rejects.toThrow(
        "Permission denied"
      );
    });

    it("throws NOT_FOUND when role does not exist", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findByIdWithPermissions.mockResolvedValue(null);

      await expect(roleService.findById("user-1", "nonexistent")).rejects.toThrow(
        "Role not found"
      );
    });
  });

  describe("create", () => {
    it("creates role when user has permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findByName.mockResolvedValue(null);
      mockedRoleRepo.create.mockResolvedValue(mockRole);

      const result = await roleService.create("user-1", { name: "New Role" });

      expect(result).toEqual(mockRole);
      expect(mockedRoleRepo.create).toHaveBeenCalledWith({ name: "New Role" });
    });

    it("throws FORBIDDEN when user lacks permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(false);

      await expect(
        roleService.create("user-1", { name: "New Role" })
      ).rejects.toThrow("Permission denied");
    });

    it("throws BAD_REQUEST when role name already exists", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findByName.mockResolvedValue(mockRole);

      await expect(
        roleService.create("user-1", { name: "Test Role" })
      ).rejects.toThrow("Role name already exists");
    });
  });

  describe("update", () => {
    it("updates role when user has permission", async () => {
      const updatedRole = { ...mockRole, name: "Updated Role" };
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findById.mockResolvedValue(mockRole);
      mockedRoleRepo.findByName.mockResolvedValue(null);
      mockedRoleRepo.update.mockResolvedValue(updatedRole);

      const result = await roleService.update("user-1", "role-1", {
        name: "Updated Role",
      });

      expect(result.name).toBe("Updated Role");
    });

    it("throws FORBIDDEN when user lacks permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(false);

      await expect(
        roleService.update("user-1", "role-1", { name: "Updated" })
      ).rejects.toThrow("Permission denied");
    });

    it("throws NOT_FOUND when role does not exist", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findById.mockResolvedValue(null);

      await expect(
        roleService.update("user-1", "nonexistent", { name: "Updated" })
      ).rejects.toThrow("Role not found");
    });

    it("throws BAD_REQUEST when new name already exists", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findById.mockResolvedValue(mockRole);
      mockedRoleRepo.findByName.mockResolvedValue({ ...mockRole, id: "other-role" });

      await expect(
        roleService.update("user-1", "role-1", { name: "Existing Name" })
      ).rejects.toThrow("Role name already exists");
    });

    it("allows update without name change", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findById.mockResolvedValue(mockRole);
      mockedRoleRepo.update.mockResolvedValue(mockRole);

      await roleService.update("user-1", "role-1", { description: "New desc" });

      expect(mockedRoleRepo.findByName).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    it("deletes role when user has permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findById.mockResolvedValue(mockRole);

      await roleService.delete("user-1", "role-1");

      expect(mockedRoleRepo.delete).toHaveBeenCalledWith("role-1");
    });

    it("throws FORBIDDEN when user lacks permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(false);

      await expect(roleService.delete("user-1", "role-1")).rejects.toThrow(
        "Permission denied"
      );
    });

    it("throws NOT_FOUND when role does not exist", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findById.mockResolvedValue(null);

      await expect(roleService.delete("user-1", "nonexistent")).rejects.toThrow(
        "Role not found"
      );
    });
  });

  describe("addPermission", () => {
    it("adds permission to role when user has permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findById.mockResolvedValue(mockRole);
      mockedPermissionRepo.findById.mockResolvedValue(mockPermission);

      await roleService.addPermission("user-1", "role-1", "perm-1");

      expect(mockedRoleRepo.addPermission).toHaveBeenCalledWith("role-1", "perm-1");
    });

    it("throws FORBIDDEN when user lacks permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(false);

      await expect(
        roleService.addPermission("user-1", "role-1", "perm-1")
      ).rejects.toThrow("Permission denied");
    });

    it("throws NOT_FOUND when role does not exist", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findById.mockResolvedValue(null);

      await expect(
        roleService.addPermission("user-1", "nonexistent", "perm-1")
      ).rejects.toThrow("Role not found");
    });

    it("throws NOT_FOUND when permission does not exist", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findById.mockResolvedValue(mockRole);
      mockedPermissionRepo.findById.mockResolvedValue(null);

      await expect(
        roleService.addPermission("user-1", "role-1", "nonexistent")
      ).rejects.toThrow("Permission not found");
    });
  });

  describe("removePermission", () => {
    it("removes permission from role when user has permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findById.mockResolvedValue(mockRole);

      await roleService.removePermission("user-1", "role-1", "perm-1");

      expect(mockedRoleRepo.removePermission).toHaveBeenCalledWith("role-1", "perm-1");
    });

    it("throws FORBIDDEN when user lacks permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(false);

      await expect(
        roleService.removePermission("user-1", "role-1", "perm-1")
      ).rejects.toThrow("Permission denied");
    });

    it("throws NOT_FOUND when role does not exist", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedRoleRepo.findById.mockResolvedValue(null);

      await expect(
        roleService.removePermission("user-1", "nonexistent", "perm-1")
      ).rejects.toThrow("Role not found");
    });
  });

  describe("getAllPermissions", () => {
    it("returns all permissions when user has permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(true);
      mockedPermissionRepo.findAll.mockResolvedValue([mockPermission]);

      const result = await roleService.getAllPermissions("user-1");

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("test:read");
    });

    it("throws FORBIDDEN when user lacks permission", async () => {
      mockedPermissionService.checkUserPermission.mockResolvedValue(false);

      await expect(roleService.getAllPermissions("user-1")).rejects.toThrow(
        "Permission denied"
      );
    });
  });
});
