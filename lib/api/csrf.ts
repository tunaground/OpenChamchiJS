import { NextRequest, NextResponse } from "next/server";

/**
 * Validates Origin/Referer header to prevent CSRF attacks.
 * Should be used on state-changing endpoints that require authentication.
 *
 * @returns NextResponse with 403 if validation fails, null if valid
 */
export function validateOrigin(request: NextRequest): NextResponse | null {
  // Only check for state-changing methods
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return null;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  // At least one of origin or referer should be present
  if (!origin && !referer) {
    return NextResponse.json(
      { error: "Missing origin header" },
      { status: 403 }
    );
  }

  // Get the expected host
  const expectedHost = host?.split(":")[0]; // Remove port if present

  if (!expectedHost) {
    return NextResponse.json(
      { error: "Missing host header" },
      { status: 403 }
    );
  }

  // Validate origin if present
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (originUrl.hostname !== expectedHost) {
        return NextResponse.json(
          { error: "Invalid origin" },
          { status: 403 }
        );
      }
      return null; // Valid origin
    } catch {
      return NextResponse.json(
        { error: "Invalid origin format" },
        { status: 403 }
      );
    }
  }

  // Fall back to referer validation
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (refererUrl.hostname !== expectedHost) {
        return NextResponse.json(
          { error: "Invalid referer" },
          { status: 403 }
        );
      }
      return null; // Valid referer
    } catch {
      return NextResponse.json(
        { error: "Invalid referer format" },
        { status: 403 }
      );
    }
  }

  return NextResponse.json(
    { error: "CSRF validation failed" },
    { status: 403 }
  );
}
