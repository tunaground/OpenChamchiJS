import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userService, UserServiceError } from "@/lib/services/user";
import { handleServiceError } from "@/lib/api/error-handler";
import { parsePaginationQuery } from "@/lib/types/pagination";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const { page, search } = parsePaginationQuery(searchParams);

    const result = await userService.findAll(session.user.id, { page, search });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof UserServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
