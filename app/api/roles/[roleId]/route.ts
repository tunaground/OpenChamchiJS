import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleService, RoleServiceError } from "@/lib/services/role";
import { handleServiceError } from "@/lib/api/error-handler";
import { validateOrigin } from "@/lib/api/csrf";

interface Params {
  params: Promise<{ roleId: string }>;
}

export async function GET(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roleId } = await params;
    const role = await roleService.findById(session.user.id, roleId);

    return NextResponse.json(role);
  } catch (error) {
    if (error instanceof RoleServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roleId } = await params;
    const body = await request.json();
    const { name, description } = body;

    const role = await roleService.update(session.user.id, roleId, {
      name,
      description,
    });

    return NextResponse.json(role);
  } catch (error) {
    if (error instanceof RoleServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roleId } = await params;
    await roleService.delete(session.user.id, roleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof RoleServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
