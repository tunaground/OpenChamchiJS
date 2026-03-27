import { StoragePort } from "./ports/storage";
import { SupabaseStorageAdapter } from "./adapters/supabase";
import { S3StorageAdapter } from "./adapters/s3";
import { StorageError } from "./errors";
import { globalSettingsService } from "@/lib/services/global-settings";

export type StorageProvider = "supabase" | "s3" | "local";

let storageInstance: StoragePort | null = null;

export async function getStorageProvider(): Promise<StorageProvider | null> {
  const settings = await globalSettingsService.get();
  const provider = settings.storageProvider || process.env.STORAGE_PROVIDER;
  return (provider as StorageProvider) || null;
}

export async function isStorageEnabled(): Promise<boolean> {
  const settings = await globalSettingsService.get();
  const provider = settings.storageProvider || process.env.STORAGE_PROVIDER;
  if (!provider) return false;

  switch (provider) {
    case "supabase": {
      const url = settings.storageUrl || process.env.SUPABASE_URL;
      const key = settings.storageSecret || process.env.SUPABASE_SERVICE_KEY;
      return !!(url && key);
    }
    case "s3": {
      const accessKeyId = settings.s3AccessKeyId || process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = settings.s3SecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
      const bucket = settings.s3Bucket || process.env.S3_BUCKET;
      return !!(accessKeyId && secretAccessKey && bucket);
    }
    case "local":
      return false;
    default:
      return false;
  }
}

export async function getStorage(): Promise<StoragePort> {
  if (storageInstance) {
    return storageInstance;
  }

  const settings = await globalSettingsService.get();
  const provider = settings.storageProvider || process.env.STORAGE_PROVIDER;

  switch (provider) {
    case "supabase": {
      const url = settings.storageUrl || process.env.SUPABASE_URL;
      const secret = settings.storageSecret || process.env.SUPABASE_SERVICE_KEY;
      const bucket = settings.storageBucket || process.env.SUPABASE_STORAGE_BUCKET;
      storageInstance = new SupabaseStorageAdapter(url, secret, bucket);
      break;
    }
    case "s3": {
      const s3Region = settings.s3Region || process.env.AWS_REGION;
      const s3AccessKeyId = settings.s3AccessKeyId || process.env.AWS_ACCESS_KEY_ID;
      const s3SecretAccessKey = settings.s3SecretAccessKey || process.env.AWS_SECRET_ACCESS_KEY;
      const s3Bucket = settings.s3Bucket || process.env.S3_BUCKET;
      const s3PublicUrl = settings.s3PublicUrl || process.env.S3_PUBLIC_URL;
      const s3Endpoint = settings.s3Endpoint || process.env.S3_ENDPOINT;
      storageInstance = new S3StorageAdapter(
        s3Region,
        s3AccessKeyId,
        s3SecretAccessKey,
        s3Bucket,
        s3PublicUrl,
        s3Endpoint
      );
      break;
    }
    case "local":
      throw new StorageError("Local adapter not implemented", "NOT_CONFIGURED");
    default:
      throw new StorageError(
        `Unknown storage provider: ${provider}`,
        "NOT_CONFIGURED"
      );
  }

  return storageInstance;
}

/**
 * Reset the storage instance (for settings changes and testing)
 */
export function resetStorage(): void {
  storageInstance = null;
}

export * from "./ports/storage";
export * from "./errors";
