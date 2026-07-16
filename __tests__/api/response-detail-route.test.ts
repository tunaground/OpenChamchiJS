import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { ResponseData } from "@/lib/repositories/interfaces/response";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

const findByIdMock = jest.fn();
const updateMock = jest.fn();
const updateWithPasswordMock = jest.fn();
const deleteMock = jest.fn();
jest.mock("@/lib/services/response", () => {
  const actual = jest.requireActual("@/lib/services/response");
  return {
    ...actual,
    responseService: {
      findById: (...args: unknown[]) => findByIdMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      updateWithPassword: (...args: unknown[]) => updateWithPasswordMock(...args),
      delete: (...args: unknown[]) => deleteMock(...args),
    },
  };
});

const canManageBoardMock = jest.fn();
jest.mock("@/lib/services/role", () => ({
  roleService: { canManageBoard: (...args: unknown[]) => canManageBoardMock(...args) },
}));

import { GET, PUT, DELETE } from "@/app/api/boards/[boardId]/threads/[threadId]/responses/[responseId]/route";

const mockSession = getServerSession as jest.Mock;

const mockResponse: ResponseData = {
  id: "response-1",
  threadId: 1,
  boardId: "tuna",
  seq: 0,
  username: "tester",
  authorId: "author-123",
  userId: "user-abc",
  ip: "1.2.3.4",
  content: "hello",
  attachment: null,
  visible: true,
  deleted: false,
  createdAt: new Date(),
};

function makeParams(
  overrides: Partial<{ boardId: string; threadId: string; responseId: string }> = {}
) {
  return Promise.resolve({
    boardId: "tuna",
    threadId: "1",
    responseId: "response-1",
    ...overrides,
  });
}

describe("GET /api/boards/[boardId]/threads/[threadId]/responses/[responseId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    findByIdMock.mockResolvedValue(mockResponse);
  });

  it("strips ip and userId for an anonymous caller (no session, no cookie)", async () => {
    mockSession.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost/api/boards/tuna/threads/1/responses/response-1"
    );
    const res = await GET(request, { params: makeParams() });
    const body = await res.json();

    expect(body).not.toHaveProperty("ip");
    expect(body).not.toHaveProperty("userId");
    expect(body.id).toBe("response-1");
  });

  it("strips ip and userId for a logged-in non-admin caller even with includeIp=true", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1" } });
    canManageBoardMock.mockResolvedValue(false);

    const request = new NextRequest(
      "http://localhost/api/boards/tuna/threads/1/responses/response-1?includeIp=true"
    );
    const res = await GET(request, { params: makeParams() });
    const body = await res.json();

    expect(body).not.toHaveProperty("ip");
    expect(body).not.toHaveProperty("userId");
  });

  it("strips ip and userId for a board admin without includeIp", async () => {
    mockSession.mockResolvedValue({ user: { id: "admin-1" } });
    canManageBoardMock.mockResolvedValue(true);

    const request = new NextRequest(
      "http://localhost/api/boards/tuna/threads/1/responses/response-1"
    );
    const res = await GET(request, { params: makeParams() });
    const body = await res.json();

    expect(body).not.toHaveProperty("ip");
    expect(body).not.toHaveProperty("userId");
  });

  it("includes ip and userId for a board admin with includeIp=true", async () => {
    mockSession.mockResolvedValue({ user: { id: "admin-1" } });
    canManageBoardMock.mockResolvedValue(true);

    const request = new NextRequest(
      "http://localhost/api/boards/tuna/threads/1/responses/response-1?includeIp=true"
    );
    const res = await GET(request, { params: makeParams() });
    const body = await res.json();

    expect(body.ip).toBe("1.2.3.4");
    expect(body.userId).toBe("user-abc");
  });

  it("checks admin status against the response's own board, not the URL boardId", async () => {
    mockSession.mockResolvedValue({ user: { id: "u1" } });
    canManageBoardMock.mockResolvedValue(true);
    findByIdMock.mockResolvedValue({ ...mockResponse, boardId: "actual-board" });

    const request = new NextRequest(
      "http://localhost/api/boards/spoofed-board/threads/1/responses/response-1?includeIp=true"
    );
    await GET(request, { params: makeParams({ boardId: "spoofed-board" }) });

    expect(canManageBoardMock).toHaveBeenCalledWith("u1", "actual-board");
  });

  it("passes the URL boardId through to responseService.findById for cross-board scoping", async () => {
    mockSession.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost/api/boards/tuna/threads/1/responses/response-1"
    );
    await GET(request, { params: makeParams() });

    expect(findByIdMock).toHaveBeenCalledWith("response-1", "tuna");
  });
});

describe("PUT /api/boards/[boardId]/threads/[threadId]/responses/[responseId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updateWithPasswordMock.mockResolvedValue(mockResponse);
    updateMock.mockResolvedValue(mockResponse);
  });

  it("strips ip and userId on the thread-password path (anonymous, no session)", async () => {
    mockSession.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost/api/boards/tuna/threads/1/responses/response-1",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "thread-pass", visible: false }),
      }
    );
    const res = await PUT(request, { params: makeParams() });
    const body = await res.json();

    expect(body).not.toHaveProperty("ip");
    expect(body).not.toHaveProperty("userId");
    expect(body.id).toBe("response-1");
  });

  it("strips ip and userId on the admin (session-based) path", async () => {
    mockSession.mockResolvedValue({ user: { id: "admin-1" } });

    const request = new NextRequest(
      "http://localhost/api/boards/tuna/threads/1/responses/response-1",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visible: false }),
      }
    );
    const res = await PUT(request, { params: makeParams() });
    const body = await res.json();

    expect(body).not.toHaveProperty("ip");
    expect(body).not.toHaveProperty("userId");
  });
});

describe("DELETE /api/boards/[boardId]/threads/[threadId]/responses/[responseId]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    deleteMock.mockResolvedValue(mockResponse);
  });

  it("strips ip and userId from the delete response (anonymous, password path)", async () => {
    mockSession.mockResolvedValue(null);

    const request = new NextRequest(
      "http://localhost/api/boards/tuna/threads/1/responses/response-1",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: "resp-pass" }),
      }
    );
    const res = await DELETE(request, { params: makeParams() });
    const body = await res.json();

    expect(body).not.toHaveProperty("ip");
    expect(body).not.toHaveProperty("userId");
    expect(body.id).toBe("response-1");
  });
});
