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
  console.error("Error in roles API:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = await roleService.findAll(session.user.id);

    return NextResponse.json(roles);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const role = await roleService.create(session.user.id, { name, description });

    return NextResponse.json(role, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
