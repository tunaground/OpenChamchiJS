-- AlterTable
ALTER TABLE "GlobalSettings" ADD COLUMN     "realtimeWsApiKey" TEXT,
ADD COLUMN     "realtimeWsApiUrl" TEXT,
ADD COLUMN     "realtimeWsTokenSecret" TEXT,
ADD COLUMN     "realtimeWsUrl" TEXT;
