import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { permissionService } from "@/lib/services/permission";
import { invalidateCache, invalidateAllCaches, ALL_CACHE_TAGS } from "@/lib/cache";

// POST /api/admin/cache - Invalidate cache
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasPermission = await permissionService.checkUserPermission(
    session.user.id,
    "all:all"
  );
  if (!hasPermission) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (body.all === true) {
      // Invalidate all caches
      invalidateAllCaches();
      return NextResponse.json({ success: true, invalidated: [...ALL_CACHE_TAGS] });
    }

    if (Array.isArray(body.tags) && body.tags.length > 0) {
      // Invalidate specific tags
      for (const tag of body.tags) {
        if (typeof tag === "string") {
          invalidateCache(tag);
        }
      }
      return NextResponse.json({ success: true, invalidated: body.tags });
    }

    return NextResponse.json(
      { error: "Invalid request body. Provide 'all: true' or 'tags: string[]'" },
      { status: 400 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}
