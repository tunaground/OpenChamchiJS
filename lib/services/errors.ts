export type ServiceErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "BAD_REQUEST"
  | "CONFLICT";

/**
 * Base error class for all service errors.
 * Can be extended by specific service error classes for additional type safety.
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: ServiceErrorCode
  ) {
    super(message);
    this.name = "ServiceError";
  }
}
