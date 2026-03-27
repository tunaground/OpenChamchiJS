-- AlterTable
ALTER TABLE "GlobalSettings" ADD COLUMN     "s3AccessKeyId" TEXT,
ADD COLUMN     "s3Bucket" TEXT,
ADD COLUMN     "s3Endpoint" TEXT,
ADD COLUMN     "s3PublicUrl" TEXT,
ADD COLUMN     "s3Region" TEXT,
ADD COLUMN     "s3SecretAccessKey" TEXT;
