import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api/auth";
import { validateOrigin } from "@/lib/api/csrf";
import { permissionService } from "@/lib/services/permission";
import { CACHE_TAGS, invalidateCaches } from "@/lib/cache";

type Params = { params: Promise<{ boardId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  const auth = await requireAuth();
  if (!auth.authenticated) {
    return auth.response;
  }

  const { boardId } = await params;
  const userId = auth.user.id;

  const canUpdate =
    (await permissionService.checkUserPermission(userId, "board:update")) ||
    (await permissionService.checkUserPermission(userId, `board:${boardId}:update`));

  if (!canUpdate) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const board = await prisma.board.findUnique({ where: { id: boardId } });
  if (!board) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const previous = board.threadCount;

  const actual = await prisma.thread.count({
    where: { boardId, published: true, deleted: false },
  });

  await prisma.board.update({
    where: { id: boardId },
    data: { threadCount: actual },
  });

  invalidateCaches([CACHE_TAGS.boards, CACHE_TAGS.board(boardId)]);

  return NextResponse.json({ previous, actual });
}
