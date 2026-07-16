import { createUserService } from "@/lib/services/user";
import { RoleService } from "@/lib/services/role";
import { UserRepository, UserWithRoles } from "@/lib/repositories/interfaces/user";

// Mock the cache module
jest.mock("@/lib/cache", () => ({
  invalidateCache: jest.fn(),
  CACHE_TAGS: {
    userRoles: (userId: string) => `roles-${userId}`,
  },
}));

function createMockUserRepository(): jest.Mocked<UserRepository> {
  return {
    findAll: jest.fn(),
    findAllWithCount: jest.fn(),
    findById: jest.fn(),
    count: jest.fn(),
    setRoles: jest.fn(),
    delete: jest.fn(),
  };
}

function createMockRoleService(overrides = {}) {
  return {
    getUserRoles: jest.fn().mockResolvedValue([]),
    isAdmin: jest.fn().mockResolvedValue(false),
    isVerified: jest.fn().mockResolvedValue(false),
    canManageBoard: jest.fn().mockResolvedValue(false),
    listManagedBoardIds: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as jest.Mocked<RoleService>;
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

describe("UserService", () => {
  let userRepo: jest.Mocked<UserRepository>;
  let roleService: jest.Mocked<RoleService>;
  let service: ReturnType<typeof createUserService>;

  beforeEach(() => {
    userRepo = createMockUserRepository();
    roleService = createMockRoleService();
    service = createUserService({
      userRepository: userRepo,
      roleService,
    });
  });

  describe("findAll", () => {
    it("returns paginated users when requester has permission", async () => {
      const users = [createMockUser(), createMockUser({ id: "user-2" })];
      roleService.isAdmin.mockResolvedValue(true);
      userRepo.findAllWithCount.mockResolvedValue({ data: users, total: 2 });

      const result = await service.findAll("requester-id");

      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it("throws FORBIDDEN when requester lacks permission", async () => {
      roleService.isAdmin.mockResolvedValue(false);

      await expect(service.findAll("requester-id")).rejects.toThrow(
        "Permission denied"
      );
    });

    it("applies search filter", async () => {
      roleService.isAdmin.mockResolvedValue(true);
      userRepo.findAllWithCount.mockResolvedValue({ data: [], total: 0 });

      await service.findAll("requester-id", { search: "test" });

      expect(userRepo.findAllWithCount).toHaveBeenCalledWith(
        expect.objectContaining({ search: "test" })
      );
    });

    it("applies pagination options", async () => {
      roleService.isAdmin.mockResolvedValue(true);
      userRepo.findAllWithCount.mockResolvedValue({ data: [], total: 0 });

      await service.findAll("requester-id", { page: 3, limit: 10 });

      expect(userRepo.findAllWithCount).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 20 })
      );
    });
  });

  describe("findById", () => {
    it("returns user when requester has permission", async () => {
      const user = createMockUser();
      roleService.isAdmin.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(user);

      const result = await service.findById("requester-id", "user-1");

      expect(result).toEqual(user);
    });

    it("throws FORBIDDEN when requester lacks permission", async () => {
      roleService.isAdmin.mockResolvedValue(false);

      await expect(
        service.findById("requester-id", "user-1")
      ).rejects.toThrow("Permission denied");
    });

    it("throws NOT_FOUND when user does not exist", async () => {
      roleService.isAdmin.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(null);

      await expect(
        service.findById("requester-id", "nonexistent")
      ).rejects.toThrow("User not found");
    });
  });

  describe("delete", () => {
    it("deletes user when requester has permission", async () => {
      const user = createMockUser();
      roleService.isAdmin.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(user);

      await service.delete("requester-id", "user-1");

      expect(userRepo.delete).toHaveBeenCalledWith("user-1");
    });

    it("throws FORBIDDEN when requester lacks permission", async () => {
      roleService.isAdmin.mockResolvedValue(false);

      await expect(
        service.delete("requester-id", "user-1")
      ).rejects.toThrow("Permission denied");
    });

    it("throws BAD_REQUEST when trying to delete self", async () => {
      roleService.isAdmin.mockResolvedValue(true);

      await expect(
        service.delete("user-1", "user-1")
      ).rejects.toThrow("Cannot delete yourself");
    });

    it("throws NOT_FOUND when user does not exist", async () => {
      roleService.isAdmin.mockResolvedValue(true);
      userRepo.findById.mockResolvedValue(null);

      await expect(
        service.delete("requester-id", "nonexistent")
      ).rejects.toThrow("User not found");
    });
  });

  describe("setRoles", () => {
    it("forbids a non-admin", async () => {
      const service = createUserService({
        userRepository: createMockUserRepository(),
        roleService: createMockRoleService({ isAdmin: jest.fn().mockResolvedValue(false) }),
      });

      await expect(service.setRoles("u1", "u2", ["ADMIN"])).rejects.toThrow(
        "Permission denied"
      );
    });

    it("saves the roles for an admin", async () => {
      const userRepository = createMockUserRepository();
      userRepository.findById.mockResolvedValue(createMockUser({ id: "u2", roles: [] }));
      const service = createUserService({
        userRepository,
        roleService: createMockRoleService({ isAdmin: jest.fn().mockResolvedValue(true) }),
      });

      await service.setRoles("admin", "u2", ["VERIFIED", "free:ADMIN"]);

      expect(userRepository.setRoles).toHaveBeenCalledWith("u2", [
        "VERIFIED",
        "free:ADMIN",
      ]);
    });

    it("rejects unknown role strings", async () => {
      const userRepository = createMockUserRepository();
      userRepository.findById.mockResolvedValue(createMockUser({ id: "u2", roles: [] }));
      const service = createUserService({
        userRepository,
        roleService: createMockRoleService({ isAdmin: jest.fn().mockResolvedValue(true) }),
      });

      await expect(service.setRoles("admin", "u2", ["SUPERUSER"])).rejects.toThrow(
        "Invalid role"
      );
      expect(userRepository.setRoles).not.toHaveBeenCalled();
    });

    it("deduplicates roles", async () => {
      const userRepository = createMockUserRepository();
      userRepository.findById.mockResolvedValue(createMockUser({ id: "u2", roles: [] }));
      const service = createUserService({
        userRepository,
        roleService: createMockRoleService({ isAdmin: jest.fn().mockResolvedValue(true) }),
      });

      await service.setRoles("admin", "u2", ["ADMIN", "ADMIN"]);

      expect(userRepository.setRoles).toHaveBeenCalledWith("u2", ["ADMIN"]);
    });

    it("rejects when the target user does not exist", async () => {
      const userRepository = createMockUserRepository();
      userRepository.findById.mockResolvedValue(null);
      const service = createUserService({
        userRepository,
        roleService: createMockRoleService({ isAdmin: jest.fn().mockResolvedValue(true) }),
      });

      await expect(service.setRoles("admin", "nope", ["ADMIN"])).rejects.toThrow(
        "User not found"
      );
    });

    it("prevents an admin from removing their own ADMIN role", async () => {
      const userRepository = createMockUserRepository();
      userRepository.findById.mockResolvedValue(
        createMockUser({ id: "admin", roles: ["ADMIN"] })
      );
      const service = createUserService({
        userRepository,
        roleService: createMockRoleService({ isAdmin: jest.fn().mockResolvedValue(true) }),
      });

      await expect(service.setRoles("admin", "admin", ["VERIFIED"])).rejects.toThrow(
        "Cannot remove your own ADMIN role"
      );
    });
  });
});
