import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { userService, UserServiceError } from "@/lib/services/user";
import { handleServiceError } from "@/lib/api/error-handler";

interface Props {
  params: Promise<{ userId: string }>;
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const user = await userService.findById(session.user.id, userId);

    return NextResponse.json(user);
  } catch (error) {
    if (error instanceof UserServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: Props) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    await userService.delete(session.user.id, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof UserServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
