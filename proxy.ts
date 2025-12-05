import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/admin"];

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

  if (isProtectedRoute) {
    const token = await getToken({ req: request });

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
