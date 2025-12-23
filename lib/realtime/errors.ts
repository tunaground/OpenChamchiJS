export type RealtimeErrorCode =
  | "NOT_CONFIGURED"
  | "CONNECTION_FAILED"
  | "PUBLISH_FAILED"
  | "SUBSCRIBE_FAILED"
  | "TOKEN_GENERATION_FAILED"
  | "UNKNOWN_PROVIDER";

export class RealtimeError extends Error {
  constructor(
    message: string,
    public code: RealtimeErrorCode
  ) {
    super(message);
    this.name = "RealtimeError";
  }
}
