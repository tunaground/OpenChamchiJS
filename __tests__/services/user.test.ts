import { createUserService } from "@/lib/services/user";
import { PermissionService } from "@/lib/services/permission";
import { UserRepository, UserWithRoles } from "@/lib/repositories/interfaces/user";
import { RoleRepository, RoleData } from "@/lib/repositories/interfaces/role";

function createMockUserRepo(): jest.Mocked<UserRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    count: jest.fn(),
    addRole: jest.fn(),
    removeRole: jest.fn(),
    delete: jest.fn(),
  };
}

function createMockRoleRepo(): jest.Mocked<RoleRepository> {
  return {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByName: jest.fn(),
    findAllWithPermissions: jest.fn(),
    findByIdWithPermissions: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    addPermission: jest.fn(),
    removePermission: jest.fn(),
  };
}

function createMockPermissionService(): jest.Mocked<PermissionService> {
  return {
    getUserPermissions: jest.fn(),
    hasPermission: jest.fn(),
    hasAnyPermission: jest.fn(),
    checkUserPermission: jest.fn(),
    checkUserPermissions: jest.fn(),
  };
}

function createMockUser(overrides?: Partial<UserWithRoles>): UserWithRoles {
  return {
    id: "user-1",
    name: "Test User",
    email: "test@example.com",
    image: null,
    emailVerified: null,
    roles: [],
    ...overrides,
  };
}

function createMockRole(overrides?: Partial<RoleData>): RoleData {
  return {
    id: "role-1",
    name: "Test Role",
    description: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("UserService", () => {
  let userRepo: jest.Mocked<UserRepository>;
  let roleRepo: jest.Mocked<RoleRepository>;
  let permissionService: jest.Mocked<PermissionService>;
  let service: ReturnType<typeof createUserService>;

  beforeEach(() => {
    userRepo = createMockUserRepo();
    roleRepo = createMockRoleRepo();
    permissionService = createMockPermissionService();
    service = createUserService({
      userRepository: userRepo,
      roleRepository: roleRepo,
      permissionService,
    });
  });

  describe("findAll", () => {
    it("returns paginated users when requester has permission", async () => {
      const users = [createMockUser(), createMockUser({ id: "user-2" })];
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findAll.mockResolvedValue(users);
      userRepo.count.mockResolvedValue(2);

      const result = await service.findAll("requester-id");

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it("throws FORBIDDEN when requester lacks permission", async () => {
      permissionService.checkUserPermission.mockResolvedValue(false);

      await expect(service.findAll("requester-id")).rejects.toThrow(
        "Permission denied"
      );
    });

    it("applies search filter", async () => {
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findAll.mockResolvedValue([]);
      userRepo.count.mockResolvedValue(0);

      await service.findAll("requester-id", { search: "test" });

      expect(userRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: "test" })
      );
      expect(userRepo.count).toHaveBeenCalledWith("test");
    });

    it("applies pagination options", async () => {
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findAll.mockResolvedValue([]);
      userRepo.count.mockResolvedValue(0);

      await service.findAll("requester-id", { page: 3, limit: 10 });

      expect(userRepo.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 20 })
      );
    });
  });

  describe("findById", () => {
    it("returns user when requester has permission", async () => {
      const user = createMockUser();
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(user);

      const result = await service.findById("requester-id", "user-1");

      expect(result).toEqual(user);
    });

    it("throws FORBIDDEN when requester lacks permission", async () => {
      permissionService.checkUserPermission.mockResolvedValue(false);

      await expect(
        service.findById("requester-id", "user-1")
      ).rejects.toThrow("Permission denied");
    });

    it("throws NOT_FOUND when user does not exist", async () => {
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(null);

      await expect(
        service.findById("requester-id", "nonexistent")
      ).rejects.toThrow("User not found");
    });
  });

  describe("getAllRoles", () => {
    it("returns all roles when requester has permission", async () => {
      const roles = [createMockRole(), createMockRole({ id: "role-2" })];
      permissionService.checkUserPermission.mockResolvedValue(true);
      roleRepo.findAll.mockResolvedValue(roles);

      const result = await service.getAllRoles("requester-id");

      expect(result).toHaveLength(2);
    });

    it("throws FORBIDDEN when requester lacks permission", async () => {
      permissionService.checkUserPermission.mockResolvedValue(false);

      await expect(service.getAllRoles("requester-id")).rejects.toThrow(
        "Permission denied"
      );
    });
  });

  describe("addRole", () => {
    it("adds role to user when requester has permission", async () => {
      const user = createMockUser({ roles: [] });
      const role = createMockRole();
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(user);
      roleRepo.findById.mockResolvedValue(role);

      await service.addRole("requester-id", "user-1", "role-1");

      expect(userRepo.addRole).toHaveBeenCalledWith("user-1", "role-1");
    });

    it("throws FORBIDDEN when requester lacks permission", async () => {
      permissionService.checkUserPermission.mockResolvedValue(false);

      await expect(
        service.addRole("requester-id", "user-1", "role-1")
      ).rejects.toThrow("Permission denied");
    });

    it("throws NOT_FOUND when user does not exist", async () => {
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(null);

      await expect(
        service.addRole("requester-id", "nonexistent", "role-1")
      ).rejects.toThrow("User not found");
    });

    it("throws NOT_FOUND when role does not exist", async () => {
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(createMockUser());
      roleRepo.findById.mockResolvedValue(null);

      await expect(
        service.addRole("requester-id", "user-1", "nonexistent")
      ).rejects.toThrow("Role not found");
    });

    it("throws BAD_REQUEST when user already has role", async () => {
      const role = createMockRole();
      const user = createMockUser({ roles: [{ id: role.id, name: role.name }] });
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(user);
      roleRepo.findById.mockResolvedValue(role);

      await expect(
        service.addRole("requester-id", "user-1", "role-1")
      ).rejects.toThrow("User already has this role");
    });
  });

  describe("removeRole", () => {
    it("removes role from user when requester has permission", async () => {
      const role = createMockRole();
      const user = createMockUser({ roles: [{ id: role.id, name: role.name }] });
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(user);

      await service.removeRole("requester-id", "user-1", "role-1");

      expect(userRepo.removeRole).toHaveBeenCalledWith("user-1", "role-1");
    });

    it("throws FORBIDDEN when requester lacks permission", async () => {
      permissionService.checkUserPermission.mockResolvedValue(false);

      await expect(
        service.removeRole("requester-id", "user-1", "role-1")
      ).rejects.toThrow("Permission denied");
    });

    it("throws NOT_FOUND when user does not exist", async () => {
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(null);

      await expect(
        service.removeRole("requester-id", "nonexistent", "role-1")
      ).rejects.toThrow("User not found");
    });

    it("throws BAD_REQUEST when user does not have role", async () => {
      const user = createMockUser({ roles: [] });
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(user);

      await expect(
        service.removeRole("requester-id", "user-1", "role-1")
      ).rejects.toThrow("User does not have this role");
    });
  });

  describe("delete", () => {
    it("deletes user when requester has permission", async () => {
      const user = createMockUser();
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(user);

      await service.delete("requester-id", "user-1");

      expect(userRepo.delete).toHaveBeenCalledWith("user-1");
    });

    it("throws FORBIDDEN when requester lacks permission", async () => {
      permissionService.checkUserPermission.mockResolvedValue(false);

      await expect(
        service.delete("requester-id", "user-1")
      ).rejects.toThrow("Permission denied");
    });

    it("throws BAD_REQUEST when trying to delete self", async () => {
      permissionService.checkUserPermission.mockResolvedValue(true);

      await expect(
        service.delete("user-1", "user-1")
      ).rejects.toThrow("Cannot delete yourself");
    });

    it("throws NOT_FOUND when user does not exist", async () => {
      permissionService.checkUserPermission.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(null);

      await expect(
        service.delete("requester-id", "nonexistent")
      ).rejects.toThrow("User not found");
    });
  });
});
