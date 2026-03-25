-- AlterTable
ALTER TABLE "GlobalSettings" ADD COLUMN     "archiveBaseUrl" TEXT,
ADD COLUMN     "archiveBoards" TEXT,
ADD COLUMN     "archiveRedirect" BOOLEAN NOT NULL DEFAULT false;
