import { createRoleService } from "@/lib/services/role";
import { PrismaClient } from "@prisma/client";

jest.mock("@/lib/cache");

const mockCached = jest.fn();
const cache = require("@/lib/cache");
cache.cached = mockCached;
cache.CACHE_TAGS = {
  userRoles: (userId: string) => `roles-${userId}`,
};

// Set up mockCached as a pass-through that records arguments
mockCached.mockImplementation(<T,>(
  fn: () => Promise<T>,
  keyParts: string[],
  tags: string[]
) => fn());

describe("RoleService", () => {
  const createMockPrisma = (roles: string[] | null) => ({
    user: {
      findUnique: jest.fn().mockResolvedValue(roles === null ? null : { roles }),
    },
  });

  const serviceWith = (roles: string[] | null) =>
    createRoleService(createMockPrisma(roles) as unknown as PrismaClient);

  describe("getUserRoles", () => {
    beforeEach(() => {
      mockCached.mockClear();
    });

    it("returns the roles column", async () => {
      const service = serviceWith(["ADMIN"]);
      await expect(service.getUserRoles("u1")).resolves.toEqual(["ADMIN"]);
    });

    it("returns empty array when the user does not exist", async () => {
      const service = serviceWith(null);
      await expect(service.getUserRoles("nope")).resolves.toEqual([]);
    });

    it("returns empty array for a falsy userId without hitting the db", async () => {
      const prisma = createMockPrisma(["ADMIN"]);
      const service = createRoleService(prisma as unknown as PrismaClient);
      await expect(service.getUserRoles("")).resolves.toEqual([]);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("pins the cache key and tags for a given userId", async () => {
      mockCached.mockClear();
      const service = serviceWith(["ADMIN"]);
      await service.getUserRoles("u1");
      expect(mockCached).toHaveBeenCalledWith(
        expect.any(Function),
        ["roles", "u1"],
        ["roles-u1"]
      );
    });
  });

  describe("isAdmin", () => {
    it("is true for ADMIN", async () => {
      await expect(serviceWith(["ADMIN"]).isAdmin("u1")).resolves.toBe(true);
    });

    it("is false for VERIFIED", async () => {
      await expect(serviceWith(["VERIFIED"]).isAdmin("u1")).resolves.toBe(false);
    });

    it("is false for a board admin", async () => {
      await expect(serviceWith(["free:ADMIN"]).isAdmin("u1")).resolves.toBe(false);
    });

    it("is false for anonymous", async () => {
      await expect(serviceWith(["ADMIN"]).isAdmin("")).resolves.toBe(false);
    });
  });

  describe("isVerified", () => {
    it("is true for VERIFIED", async () => {
      await expect(serviceWith(["VERIFIED"]).isVerified("u1")).resolves.toBe(true);
    });

    it("is true for ADMIN", async () => {
      await expect(serviceWith(["ADMIN"]).isVerified("u1")).resolves.toBe(true);
    });

    it("is false for a board admin only", async () => {
      await expect(serviceWith(["free:ADMIN"]).isVerified("u1")).resolves.toBe(false);
    });

    it("is false for anonymous", async () => {
      await expect(serviceWith(["ADMIN"]).isVerified("")).resolves.toBe(false);
    });
  });

  describe("canManageBoard", () => {
    it("is true for ADMIN on any board", async () => {
      const service = serviceWith(["ADMIN"]);
      await expect(service.canManageBoard("u1", "anything")).resolves.toBe(true);
    });

    it("is true for the matching board admin", async () => {
      const service = serviceWith(["free:ADMIN"]);
      await expect(service.canManageBoard("u1", "free")).resolves.toBe(true);
    });

    it("is false for a different board", async () => {
      const service = serviceWith(["boardA:ADMIN"]);
      await expect(service.canManageBoard("u1", "boardB")).resolves.toBe(false);
    });

    it("is false for VERIFIED only", async () => {
      const service = serviceWith(["VERIFIED"]);
      await expect(service.canManageBoard("u1", "free")).resolves.toBe(false);
    });

    it("is false for anonymous", async () => {
      await expect(serviceWith(["free:ADMIN"]).canManageBoard("", "free")).resolves.toBe(false);
    });
  });

  describe("listManagedBoardIds", () => {
    it('returns "all" for ADMIN', async () => {
      await expect(serviceWith(["ADMIN"]).listManagedBoardIds("u1")).resolves.toBe("all");
    });

    it("returns only board ids for a board admin", async () => {
      const service = serviceWith(["VERIFIED", "boardA:ADMIN", "boardB:ADMIN"]);
      await expect(service.listManagedBoardIds("u1")).resolves.toEqual([
        "boardA",
        "boardB",
      ]);
    });

    it("returns empty array for a user with no board roles", async () => {
      await expect(serviceWith(["VERIFIED"]).listManagedBoardIds("u1")).resolves.toEqual([]);
    });

    it("returns empty array for anonymous", async () => {
      await expect(serviceWith(["ADMIN"]).listManagedBoardIds("")).resolves.toEqual([]);
    });
  });
});
