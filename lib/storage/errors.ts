export type StorageErrorCode =
  | "UPLOAD_FAILED"
  | "DELETE_FAILED"
  | "FILE_TOO_LARGE"
  | "INVALID_MIME_TYPE"
  | "NOT_CONFIGURED"
  | "CONNECTION_ERROR";

export class StorageError extends Error {
  constructor(
    message: string,
    public code: StorageErrorCode
  ) {
    super(message);
    this.name = "StorageError";
  }
}
