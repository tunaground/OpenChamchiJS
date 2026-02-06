import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { responseService, SearchType } from "@/lib/services/response";
import { ContentSearchCursor } from "@/lib/repositories/interfaces/response";

interface Params {
  params: Promise<{ boardId: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { boardId } = await params;
  const userId = session.user.id;

  // Check permissions
  const canDeleteGlobal = await permissionService.checkUserPermission(userId, "response:delete");
  const canDeleteBoard = await permissionService.checkUserPermission(userId, `response:${boardId}:delete`);

  if (!canDeleteGlobal && !canDeleteBoard) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const searchParams = request.nextUrl.searchParams;
  const searchType = searchParams.get("searchType") as SearchType | null;
  const search = searchParams.get("search") ?? undefined;
  const cursorParam = searchParams.get("cursor");
  const page = parseInt(searchParams.get("page") ?? "1", 10);

  // Parse cursor from JSON string
  let cursor: ContentSearchCursor | null = null;
  if (cursorParam) {
    try {
      cursor = JSON.parse(cursorParam);
    } catch {
      // Invalid cursor, ignore
    }
  }

  const result = await responseService.findByBoardId(boardId, {
    page,
    searchType: searchType ?? undefined,
    search,
    cursor,
    includeDeleted: true,
  });

  return NextResponse.json({
    data: result.data.map((response) => ({
      id: response.id,
      threadId: response.threadId,
      threadTitle: response.thread?.title ?? "",
      seq: response.seq,
      username: response.username,
      authorId: response.authorId,
      userId: response.userId,
      userName: response.user?.name ?? null,
      content: response.content,
      visible: response.visible,
      deleted: response.deleted,
      createdAt: response.createdAt.toISOString(),
    })),
    pagination: result.pagination,
    cursor: result.cursor,
  });
}
