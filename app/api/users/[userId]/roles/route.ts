import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userService, UserServiceError } from "@/lib/services/user";
import { handleServiceError } from "@/lib/api/error-handler";
import { validateOrigin } from "@/lib/api/csrf";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function POST(request: NextRequest, { params }: Props) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const body = await request.json();
    const { roleId } = body;

    if (!roleId) {
      return NextResponse.json(
        { error: "roleId is required" },
        { status: 400 }
      );
    }

    await userService.addRole(session.user.id, userId, roleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const roleId = searchParams.get("roleId");

    if (!roleId) {
      return NextResponse.json(
        { error: "roleId is required" },
        { status: 400 }
      );
    }

    await userService.removeRole(session.user.id, userId, roleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
