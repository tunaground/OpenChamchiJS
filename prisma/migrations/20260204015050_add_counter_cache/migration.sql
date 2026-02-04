-- AlterTable
ALTER TABLE "Board" ADD COLUMN     "threadCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "responseCount" INTEGER NOT NULL DEFAULT 0;

-- Sync Thread.responseCount (total responses including deleted)
UPDATE "Thread" t
SET "responseCount" = (
  SELECT COUNT(*) FROM "Response" r
  WHERE r."threadId" = t."id"
);

-- Sync Board.threadCount (active threads: published && !deleted)
UPDATE "Board" b
SET "threadCount" = (
  SELECT COUNT(*) FROM "Thread" t
  WHERE t."boardId" = b."id" AND t."published" = true AND t."deleted" = false
);
