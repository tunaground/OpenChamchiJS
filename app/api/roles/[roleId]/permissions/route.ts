import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleService, RoleServiceError } from "@/lib/services/role";

function handleError(error: unknown) {
  if (error instanceof RoleServiceError) {
    const statusMap = {
      FORBIDDEN: 403,
      NOT_FOUND: 404,
      BAD_REQUEST: 400,
    };
    return NextResponse.json(
      { error: error.message },
      { status: statusMap[error.code] }
    );
  }
  console.error("Error in role permissions API:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

interface Params {
  params: Promise<{ roleId: string }>;
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roleId } = await params;
    const body = await request.json();
    const { permissionId } = body;

    if (!permissionId || typeof permissionId !== "string") {
      return NextResponse.json(
        { error: "Permission ID is required" },
        { status: 400 }
      );
    }

    await roleService.addPermission(session.user.id, roleId, permissionId);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roleId } = await params;
    const { searchParams } = new URL(request.url);
    const permissionId = searchParams.get("permissionId");

    if (!permissionId) {
      return NextResponse.json(
        { error: "Permission ID is required" },
        { status: 400 }
      );
    }

    await roleService.removePermission(session.user.id, roleId, permissionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
