import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication only
const protectedRoutes = ["/dashboard"];

// Routes that require admin:read permission
const adminRoutes = ["/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip for api, static files
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check if this is a setup path
  const isSetupPath =
    pathname === "/setup" || pathname.startsWith("/setup/");

  if (!isSetupPath) {
    // Check if setup is needed
    const setupCheckUrl = new URL("/api/setup-check", request.url);
    try {
      const response = await fetch(setupCheckUrl);
      const { needsSetup } = await response.json();

      if (needsSetup) {
        return NextResponse.redirect(new URL("/setup", request.url));
      }
    } catch {
      // If check fails, continue normally
    }
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if route requires admin permission
  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtectedRoute || isAdminRoute) {
    const token = await getToken({ req: request });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // For admin routes, check admin:read permission
    if (isAdminRoute) {
      try {
        const permissionsUrl = new URL("/api/permissions", request.url);
        const response = await fetch(permissionsUrl, {
          headers: {
            cookie: request.headers.get("cookie") || "",
          },
        });

        if (!response.ok) {
          return NextResponse.redirect(new URL("/", request.url));
        }

        const permissions: string[] = await response.json();
        const hasAdminAccess =
          permissions.includes("all:all") ||
          permissions.includes("admin:read");

        if (!hasAdminAccess) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } catch {
        // If permission check fails, deny access
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
