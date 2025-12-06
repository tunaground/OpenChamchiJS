import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleService, RoleServiceError } from "@/lib/services/role";
import { handleServiceError } from "@/lib/api/error-handler";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const permissions = await roleService.getAllPermissions(session.user.id);

    return NextResponse.json(permissions);
  } catch (error) {
    if (error instanceof RoleServiceError) {
      return handleServiceError(error);
    }
    throw error;
  }
}
