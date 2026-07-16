import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { validateOrigin } from "@/lib/api/csrf";
import { userService, UserServiceError } from "@/lib/services/user";
import { handleServiceError } from "@/lib/api/error-handler";

interface Props {
  params: Promise<{ userId: string }>;
}

const setRolesSchema = z.object({
  roles: z.array(z.string()),
});

// PATCH /api/users/[userId]/roles - 사용자 롤 일괄 저장
export async function PATCH(request: NextRequest, { params }: Props) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const parsed = setRolesSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    await userService.setRoles(session.user.id, userId, parsed.data.roles);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
