import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleService, RoleServiceError } from "@/lib/services/role";
import { handleServiceError } from "@/lib/api/error-handler";

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
    if (error instanceof RoleServiceError) {
      return handleServiceError(error);
    }
    throw error;
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
    if (error instanceof RoleServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
