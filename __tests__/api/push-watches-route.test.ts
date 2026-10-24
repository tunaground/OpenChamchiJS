import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { ThreadWatchServiceError } from "@/lib/services/thread-watch";

jest.mock("next-auth", () => ({ getServerSession: jest.fn() }));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

const listMock = jest.fn();
const watchMock = jest.fn();
jest.mock("@/lib/services/thread-watch", () => {
  const actual = jest.requireActual("@/lib/services/thread-watch");
  return {
    ...actual,
    threadWatchService: {
      list: (...args: unknown[]) => listMock(...args),
      watch: (...args: unknown[]) => watchMock(...args),
    },
  };
});

import { GET, POST } from "@/app/api/push/watches/route";

const mockSession = getServerSession as jest.Mock;

function postRequest(body: unknown, origin = "http://localhost") {
  return new NextRequest("http://localhost/api/push/watches", {
    method: "POST",
    headers: { origin, host: "localhost", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/push/watches", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSession.mockResolvedValue({ user: { id: "u1" } });
  });

  it("GET returns 401 when not logged in", async () => {
    mockSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns the caller's list", async () => {
    const list = { items: [], limit: 5, pushEnabled: true };
    listMock.mockResolvedValue(list);
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(list);
    expect(listMock).toHaveBeenCalledWith("u1");
  });

  it("POST returns 403 on foreign origin", async () => {
    const res = await POST(postRequest({ threadId: 1 }, "http://evil.example"));
    expect(res.status).toBe(403);
    expect(watchMock).not.toHaveBeenCalled();
  });

  it("POST returns 204 and watches the thread", async () => {
    const res = await POST(postRequest({ threadId: 1 }));
    expect(res.status).toBe(204);
    expect(watchMock).toHaveBeenCalledWith("u1", 1);
  });

  it("POST returns 409 with WATCH_LIMIT_EXCEEDED body when service throws that code", async () => {
    watchMock.mockRejectedValue(new ThreadWatchServiceError("Watch limit exceeded", "WATCH_LIMIT_EXCEEDED"));
    const res = await POST(postRequest({ threadId: 1 }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "WATCH_LIMIT_EXCEEDED" });
  });

  it("POST returns 404 when feature disabled", async () => {
    watchMock.mockRejectedValue(new ThreadWatchServiceError("Web push is disabled", "FEATURE_DISABLED"));
    const res = await POST(postRequest({ threadId: 1 }));
    expect(res.status).toBe(404);
  });

  it("POST returns 400 on non-numeric threadId", async () => {
    const res = await POST(postRequest({ threadId: "abc" }));
    expect(res.status).toBe(400);
    expect(watchMock).not.toHaveBeenCalled();
  });
});
