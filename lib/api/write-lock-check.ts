import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
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
    const hasPermission = await permissionService.checkUserPermissions(
      session.user.id,
      ["thread:edit", `thread:${board.id}:edit`]
    );
    if (hasPermission) {
      return null;
    }
  }

  return NextResponse.json(
    { error: "WRITE_LOCKED" },
    { status: 403 }
  );
}
