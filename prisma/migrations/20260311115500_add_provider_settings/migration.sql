-- AlterTable
ALTER TABLE "GlobalSettings" ADD COLUMN     "realtimeApiKey" TEXT,
ADD COLUMN     "realtimeProvider" TEXT,
ADD COLUMN     "storageBucket" TEXT,
ADD COLUMN     "storageProvider" TEXT,
ADD COLUMN     "storageSecret" TEXT,
ADD COLUMN     "storageUrl" TEXT;
