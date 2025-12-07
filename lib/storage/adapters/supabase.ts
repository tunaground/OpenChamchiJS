import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import {
  StoragePort,
  UploadResult,
  UploadOptions,
  DEFAULT_UPLOAD_OPTIONS,
} from "../ports/storage";
import { StorageError } from "../errors";

export class SupabaseStorageAdapter implements StoragePort {
  private client: SupabaseClient;
  private bucket: string;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || "attachments";

    if (!supabaseUrl || !supabaseKey) {
      throw new StorageError(
        "Supabase configuration missing (SUPABASE_URL, SUPABASE_SERVICE_KEY)",
        "NOT_CONFIGURED"
      );
    }

    this.client = createClient(supabaseUrl, supabaseKey);
  }

  async upload(
    file: Buffer,
    filename: string,
    mimeType: string,
    options?: UploadOptions
  ): Promise<UploadResult> {
    const opts = { ...DEFAULT_UPLOAD_OPTIONS, ...options };

    if (file.length > opts.maxSizeBytes) {
      throw new StorageError(
        `File size ${file.length} exceeds maximum ${opts.maxSizeBytes}`,
        "FILE_TOO_LARGE"
      );
    }

    if (!opts.allowedMimeTypes.includes(mimeType)) {
      throw new StorageError(
        `MIME type ${mimeType} not allowed. Allowed: ${opts.allowedMimeTypes.join(", ")}`,
        "INVALID_MIME_TYPE"
      );
    }

    const ext = filename.split(".").pop() || "bin";
    const uniqueFilename = `${uuidv4()}.${ext}`;
    const key = `${opts.folder}/${uniqueFilename}`;

    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, file, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      throw new StorageError(`Upload failed: ${error.message}`, "UPLOAD_FAILED");
    }

    const { data: urlData } = this.client.storage
      .from(this.bucket)
      .getPublicUrl(key);

    return {
      url: urlData.publicUrl,
      key,
      size: file.length,
      mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    const { error } = await this.client.storage.from(this.bucket).remove([key]);

    if (error) {
      throw new StorageError(`Delete failed: ${error.message}`, "DELETE_FAILED");
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.client.storage.getBucket(this.bucket);
      return !error;
    } catch {
      return false;
    }
  }
}
