import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleService } from "@/lib/services/role";
import { BoardData } from "@/lib/repositories/interfaces/board";

export async function checkWriteLocked(
  request: NextRequest,
  board: BoardData
): Promise<NextResponse | null> {
  if (!board.writeLocked) {
    return null;
  }

  const session = await getServerSession(authOptions);
  if (session) {
    const canManage = await roleService.canManageBoard(session.user.id, board.id);
    if (canManage) {
      return null;
    }
  }

  return NextResponse.json(
    { error: "WRITE_LOCKED" },
    { status: 403 }
  );
}
