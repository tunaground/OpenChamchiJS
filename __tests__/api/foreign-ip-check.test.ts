import { NextRequest } from "next/server";
import { checkForeignIpBlocked } from "@/lib/api/foreign-ip-check";
import { getServerSession } from "next-auth";
import { roleService } from "@/lib/services/role";
import { isForeignIp } from "@/lib/ip";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("@/lib/ip", () => ({ isForeignIp: jest.fn() }));
jest.mock("@/lib/services/global-settings", () => ({
  globalSettingsService: { getCountryCode: jest.fn().mockResolvedValue("KR") },
}));
jest.mock("@/lib/services/role", () => ({
  roleService: { isVerified: jest.fn() },
}));

const mockSession = getServerSession as jest.Mock;
const mockIsVerified = roleService.isVerified as jest.Mock;
const mockIsForeignIp = isForeignIp as jest.Mock;

const request = new NextRequest("http://localhost/api/test");
const blockingBoard = { id: "free", blockForeignIp: true } as never;
const openBoard = { id: "free", blockForeignIp: false } as never;

describe("checkForeignIpBlocked", () => {
  beforeEach(() => jest.clearAllMocks());

  it("allows when the board does not block foreign ips", async () => {
    await expect(checkForeignIpBlocked(request, openBoard)).resolves.toBeNull();
  });

  it("allows a domestic ip", async () => {
    mockIsForeignIp.mockReturnValue(false);

    await expect(checkForeignIpBlocked(request, blockingBoard)).resolves.toBeNull();
  });

  it("blocks an anonymous foreign ip", async () => {
    mockIsForeignIp.mockReturnValue(true);
    mockSession.mockResolvedValue(null);

    const result = await checkForeignIpBlocked(request, blockingBoard);

    expect(result?.status).toBe(403);
    await expect(result?.json()).resolves.toEqual({ error: "FOREIGN_IP_BLOCKED" });
  });

  it("allows a VERIFIED user from a foreign ip", async () => {
    mockIsForeignIp.mockReturnValue(true);
    mockSession.mockResolvedValue({ user: { id: "u1" } });
    mockIsVerified.mockResolvedValue(true);

    await expect(checkForeignIpBlocked(request, blockingBoard)).resolves.toBeNull();
    expect(mockIsVerified).toHaveBeenCalledWith("u1");
  });

  it("blocks a non-verified logged-in user from a foreign ip", async () => {
    mockIsForeignIp.mockReturnValue(true);
    mockSession.mockResolvedValue({ user: { id: "u1" } });
    mockIsVerified.mockResolvedValue(false);

    const result = await checkForeignIpBlocked(request, blockingBoard);

    expect(result?.status).toBe(403);
  });
});
