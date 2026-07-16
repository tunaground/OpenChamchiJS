import {
  ROLE,
  boardAdminRole,
  isBoardAdminRole,
  boardIdFromRole,
} from "@/lib/auth/roles";

describe("roles", () => {
  it("exposes the three role constants", () => {
    expect(ROLE.ADMIN).toBe("ADMIN");
    expect(ROLE.VERIFIED).toBe("VERIFIED");
  });

  describe("boardAdminRole", () => {
    it("builds a board admin role string", () => {
      expect(boardAdminRole("free")).toBe("free:ADMIN");
    });
  });

  describe("isBoardAdminRole", () => {
    it("returns true for a board admin role", () => {
      expect(isBoardAdminRole("free:ADMIN")).toBe(true);
    });

    it("returns false for the system admin role", () => {
      expect(isBoardAdminRole("ADMIN")).toBe(false);
    });

    it("returns false for VERIFIED", () => {
      expect(isBoardAdminRole("VERIFIED")).toBe(false);
    });

    it("returns false for an empty board id", () => {
      expect(isBoardAdminRole(":ADMIN")).toBe(false);
    });
  });

  describe("boardIdFromRole", () => {
    it("extracts the board id", () => {
      expect(boardIdFromRole("free:ADMIN")).toBe("free");
    });

    it("returns null for non board admin roles", () => {
      expect(boardIdFromRole("ADMIN")).toBeNull();
      expect(boardIdFromRole("VERIFIED")).toBeNull();
    });
  });
});
