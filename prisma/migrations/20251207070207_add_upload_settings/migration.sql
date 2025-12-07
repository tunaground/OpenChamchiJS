-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "uploadMaxSize" INTEGER NOT NULL DEFAULT 5242880,
ADD COLUMN     "uploadMimeTypes" TEXT NOT NULL DEFAULT 'image/png,image/jpeg,image/gif,image/webp';
