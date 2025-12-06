import { createPermissionService } from "@/lib/services/permission";
import { PrismaClient } from "@prisma/client";

describe("PermissionService", () => {
  const createMockPrisma = () => ({
    user: {
      findUnique: jest.fn(),
    },
  });

  describe("getUserPermissions", () => {
    it("should return empty array when user not found", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const service = createPermissionService(mockPrisma as unknown as PrismaClient);

      const result = await service.getUserPermissions("non-existent");

      expect(result).toEqual([]);
    });

    it("should return permissions from user roles", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        userRoles: [
          {
            role: {
              permissions: [
                { permission: { name: "board:read" } },
                { permission: { name: "board:write" } },
              ],
            },
          },
        ],
      });

      const service = createPermissionService(mockPrisma as unknown as PrismaClient);

      const result = await service.getUserPermissions("user-1");

      expect(result).toContain("board:read");
      expect(result).toContain("board:write");
      expect(result).toHaveLength(2);
    });

    it("should deduplicate permissions from multiple roles", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        userRoles: [
          {
            role: {
              permissions: [{ permission: { name: "board:read" } }],
            },
          },
          {
            role: {
              permissions: [
                { permission: { name: "board:read" } },
                { permission: { name: "board:write" } },
              ],
            },
          },
        ],
      });

      const service = createPermissionService(mockPrisma as unknown as PrismaClient);

      const result = await service.getUserPermissions("user-1");

      expect(result).toHaveLength(2);
    });
  });

  describe("hasPermission", () => {
    it("should return true when user has the permission", () => {
      const mockPrisma = createMockPrisma();
      const service = createPermissionService(mockPrisma as unknown as PrismaClient);

      const result = service.hasPermission(
        ["board:read", "board:write"],
        "board:read"
      );

      expect(result).toBe(true);
    });

    it("should return false when user does not have the permission", () => {
      const mockPrisma = createMockPrisma();
      const service = createPermissionService(mockPrisma as unknown as PrismaClient);

      const result = service.hasPermission(["board:read"], "board:write");

      expect(result).toBe(false);
    });

    it("should return true when user has all:all permission", () => {
      const mockPrisma = createMockPrisma();
      const service = createPermissionService(mockPrisma as unknown as PrismaClient);

      const result = service.hasPermission(["all:all"], "any:permission");

      expect(result).toBe(true);
    });
  });

  describe("checkUserPermission", () => {
    it("should return true when user has permission", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        userRoles: [
          {
            role: {
              permissions: [{ permission: { name: "board:read" } }],
            },
          },
        ],
      });

      const service = createPermissionService(mockPrisma as unknown as PrismaClient);

      const result = await service.checkUserPermission("user-1", "board:read");

      expect(result).toBe(true);
    });

    it("should return false when user does not have permission", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        userRoles: [
          {
            role: {
              permissions: [{ permission: { name: "board:read" } }],
            },
          },
        ],
      });

      const service = createPermissionService(mockPrisma as unknown as PrismaClient);

      const result = await service.checkUserPermission("user-1", "board:write");

      expect(result).toBe(false);
    });

    it("should return true for any permission when user has all:all", async () => {
      const mockPrisma = createMockPrisma();
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "admin-1",
        userRoles: [
          {
            role: {
              permissions: [{ permission: { name: "all:all" } }],
            },
          },
        ],
      });

      const service = createPermissionService(mockPrisma as unknown as PrismaClient);

      const result = await service.checkUserPermission(
        "admin-1",
        "any:permission"
      );

      expect(result).toBe(true);
    });
  });
});
