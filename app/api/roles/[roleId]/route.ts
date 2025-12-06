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
  console.error("Error in role API:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

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
    return handleError(error);
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
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
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roleId } = await params;
    await roleService.delete(session.user.id, roleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
