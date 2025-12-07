import { NextRequest, NextResponse } from "next/server";

const REALTIME_PROVIDER = process.env.REALTIME_PROVIDER || "ably";

export async function GET(request: NextRequest) {
  try {
    // Extract client IP for presence deduplication
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";

    switch (REALTIME_PROVIDER) {
      case "ably": {
        const { createAblyTokenRequest } = await import(
          "@/lib/realtime/adapters/ably/token"
        );
        const tokenRequest = await createAblyTokenRequest(clientIp);
        return NextResponse.json(tokenRequest);
      }
      default:
        return NextResponse.json(
          { error: `Unknown realtime provider: ${REALTIME_PROVIDER}` },
          { status: 500 }
        );
    }
  } catch (error) {
    console.error("Failed to create realtime token:", error);
    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
