import { NextRequest } from "next/server";
import { checkWriteLocked } from "@/lib/api/write-lock-check";
import { getServerSession } from "next-auth";
import { roleService } from "@/lib/services/role";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/services/role", () => ({
  roleService: { canManageBoard: jest.fn() },
}));

const mockSession = getServerSession as jest.Mock;
const mockCanManageBoard = roleService.canManageBoard as jest.Mock;

const request = new NextRequest("http://localhost/api/test");
const lockedBoard = { id: "free", writeLocked: true } as never;
const openBoard = { id: "free", writeLocked: false } as never;

describe("checkWriteLocked", () => {
  beforeEach(() => jest.clearAllMocks());

  it("allows anyone when the board is not locked", async () => {
    await expect(checkWriteLocked(request, openBoard)).resolves.toBeNull();
  });

  it("blocks an anonymous writer on a locked board", async () => {
    mockSession.mockResolvedValue(null);

    const result = await checkWriteLocked(request, lockedBoard);

    expect(result?.status).toBe(403);
    await expect(result?.json()).resolves.toEqual({ error: "WRITE_LOCKED" });
  });

  it("allows a board admin on a locked board", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1" } });
    mockCanManageBoard.mockResolvedValue(true);

    await expect(checkWriteLocked(request, lockedBoard)).resolves.toBeNull();
    expect(mockCanManageBoard).toHaveBeenCalledWith("u1", "free");
  });

  it("blocks a logged-in user who does not manage the board", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1" } });
    mockCanManageBoard.mockResolvedValue(false);

    const result = await checkWriteLocked(request, lockedBoard);

    expect(result?.status).toBe(403);
  });
});
