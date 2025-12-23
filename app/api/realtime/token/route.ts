import { NextRequest, NextResponse } from "next/server";
import {
  getServerRealtimeProvider,
  isServerRealtimeEnabled,
} from "@/lib/realtime/config";
import { RealtimeError } from "@/lib/realtime/errors";

export async function GET(request: NextRequest) {
  try {
    // Check if realtime is enabled
    if (!isServerRealtimeEnabled()) {
      return NextResponse.json(
        { error: "Realtime is not configured" },
        { status: 503 }
      );
    }

    // Extract client IP for presence deduplication
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";

    const provider = getServerRealtimeProvider();

    switch (provider) {
      case "ably": {
        const { createAblyTokenRequest } = await import(
          "@/lib/realtime/adapters/ably/token"
        );
        const tokenRequest = await createAblyTokenRequest(clientIp);
        return NextResponse.json(tokenRequest);
      }
      case "pusher": {
        return NextResponse.json(
          { error: "Pusher token generation not implemented" },
          { status: 501 }
        );
      }
      case "socketio": {
        return NextResponse.json(
          { error: "Socket.io does not require token generation" },
          { status: 400 }
        );
      }
      default:
        return NextResponse.json(
          { error: `Unknown realtime provider: ${provider}` },
          { status: 500 }
        );
    }
  } catch (error) {
    console.error("Failed to create realtime token:", error);

    if (error instanceof RealtimeError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.code === "NOT_CONFIGURED" ? 503 : 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to create token" },
      { status: 500 }
    );
  }
}
