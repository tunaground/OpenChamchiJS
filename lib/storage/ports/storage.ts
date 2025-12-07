export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface UploadOptions {
  maxSizeBytes?: number;
  allowedMimeTypes?: string[];
  folder?: string;
}

export interface StoragePort {
  upload(
    file: Buffer,
    filename: string,
    mimeType: string,
    options?: UploadOptions
  ): Promise<UploadResult>;

  delete(key: string): Promise<void>;

  healthCheck(): Promise<boolean>;
}

export const DEFAULT_UPLOAD_OPTIONS: Required<UploadOptions> = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ["image/png", "image/jpeg", "image/gif", "image/webp"],
  folder: "attachments",
};
