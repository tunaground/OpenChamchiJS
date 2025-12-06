import { NextResponse } from "next/server";
import { ServiceErrorCode, ServiceError } from "@/lib/services/errors";

const STATUS_MAP: Record<ServiceErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  BAD_REQUEST: 400,
  CONFLICT: 409,
};

export function handleServiceError(error: ServiceError): NextResponse {
  const status = STATUS_MAP[error.code] ?? 500;
  return NextResponse.json({ error: error.message }, { status });
}
