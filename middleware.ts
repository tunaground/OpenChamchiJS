import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "./lib/i18n/routing";

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
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

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
