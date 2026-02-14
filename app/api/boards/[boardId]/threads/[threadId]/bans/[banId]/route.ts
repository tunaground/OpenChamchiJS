import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  threadBanService,
  ThreadBanServiceError,
} from "@/lib/services/thread-ban";
import { handleServiceError } from "@/lib/api/error-handler";

// DELETE /api/boards/[boardId]/threads/[threadId]/bans/[banId] - 밴 삭제
export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ boardId: string; threadId: string; banId: string }> }
) {
  const { banId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const ban = await threadBanService.deleteBan(session.user.id, banId);
    return NextResponse.json(ban);
  } catch (error) {
    if (error instanceof ThreadBanServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
