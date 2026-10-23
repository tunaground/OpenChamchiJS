import { NextResponse } from "next/server";
import { ServiceErrorCode, ServiceError } from "@/lib/services/errors";

const STATUS_MAP: Record<ServiceErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  CONFLICT: 409,
  WATCH_LIMIT_EXCEEDED: 409,
  FEATURE_DISABLED: 404,
};

export function handleServiceError(error: ServiceError): NextResponse {
  const status = STATUS_MAP[error.code] ?? 500;
  // Clients branch on this code to show the "list is full" message
  const message = error.code === "WATCH_LIMIT_EXCEEDED" ? error.code : error.message;
  return NextResponse.json({ error: message }, { status });
}
