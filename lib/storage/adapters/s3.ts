import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import {
  StoragePort,
  UploadResult,
  UploadOptions,
  DEFAULT_UPLOAD_OPTIONS,
} from "../ports/storage";
import { StorageError } from "../errors";

export class S3StorageAdapter implements StoragePort {
  private client: S3Client;
  private bucket: string;
  private publicUrl: string | null;

  constructor(
    region?: string | null,
    accessKeyId?: string | null,
    secretAccessKey?: string | null,
    bucket?: string | null,
    publicUrl?: string | null,
    endpoint?: string | null
  ) {
    if (!accessKeyId || !secretAccessKey) {
      throw new StorageError(
        "S3 configuration missing (accessKeyId and secretAccessKey required)",
        "NOT_CONFIGURED"
      );
    }

    if (!bucket) {
      throw new StorageError(
        "S3 configuration missing (bucket required)",
        "NOT_CONFIGURED"
      );
    }

    this.bucket = bucket;
    this.publicUrl = publicUrl?.replace(/\/+$/, "") || null;

    const clientConfig: ConstructorParameters<typeof S3Client>[0] = {
      region: region || "us-east-1",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    };

    if (endpoint) {
      clientConfig.endpoint = endpoint;
      clientConfig.forcePathStyle = true;
    }

    this.client = new S3Client(clientConfig);
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

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file,
          ContentType: mimeType,
        })
      );
    } catch (err) {
      throw new StorageError(
        `Upload failed: ${err instanceof Error ? err.message : String(err)}`,
        "UPLOAD_FAILED"
      );
    }

    const url = this.publicUrl
      ? `${this.publicUrl}/${key}`
      : `https://${this.bucket}.s3.${this.client.config.region}.amazonaws.com/${key}`;

    return {
      url,
      key,
      size: file.length,
      mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
    } catch (err) {
      throw new StorageError(
        `Delete failed: ${err instanceof Error ? err.message : String(err)}`,
        "DELETE_FAILED"
      );
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.send(
        new HeadBucketCommand({ Bucket: this.bucket })
      );
      return true;
    } catch {
      return false;
    }
  }
}
