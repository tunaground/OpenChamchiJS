import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { roleService, RoleServiceError } from "@/lib/services/role";

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
    console.error("Error fetching permissions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
