import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleService, RoleServiceError } from "@/lib/services/role";
import { handleServiceError } from "@/lib/api/error-handler";
import { validateOrigin } from "@/lib/api/csrf";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roles = await roleService.findAll(session.user.id);

    return NextResponse.json(roles);
  } catch (error) {
    if (error instanceof RoleServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const csrfError = validateOrigin(request);
  if (csrfError) return csrfError;

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
    if (error instanceof RoleServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
