import { StoragePort } from "./ports/storage";
import { SupabaseStorageAdapter } from "./adapters/supabase";
import { StorageError } from "./errors";

export type StorageProvider = "supabase" | "s3" | "local";

let storageInstance: StoragePort | null = null;

export function getStorageProvider(): StorageProvider | null {
  return (process.env.STORAGE_PROVIDER as StorageProvider) || null;
}

export function isStorageEnabled(): boolean {
  const provider = getStorageProvider();
  if (!provider) return false;

  switch (provider) {
    case "supabase":
      return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY);
    case "s3":
      return false; // Not implemented
    case "local":
      return false; // Not implemented
    default:
      return false;
  }
}

export function getStorage(): StoragePort {
  if (storageInstance) {
    return storageInstance;
  }

  const provider = getStorageProvider();

  switch (provider) {
    case "supabase":
      storageInstance = new SupabaseStorageAdapter();
      break;
    case "s3":
      throw new StorageError("S3 adapter not implemented", "NOT_CONFIGURED");
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

export * from "./ports/storage";
export * from "./errors";
