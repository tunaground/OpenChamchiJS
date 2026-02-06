-- 1. Add nullable boardId column
ALTER TABLE "Response" ADD COLUMN "boardId" TEXT;

-- 2. Populate boardId from Thread
UPDATE "Response" r
SET "boardId" = t."boardId"
FROM "Thread" t
WHERE r."threadId" = t.id;

-- 3. Set NOT NULL constraint
ALTER TABLE "Response" ALTER COLUMN "boardId" SET NOT NULL;

-- 4. Add foreign key constraint
ALTER TABLE "Response" ADD CONSTRAINT "Response_boardId_fkey"
FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 5. Create index for board-level queries
CREATE INDEX "Response_boardId_deleted_createdAt_idx"
ON "Response"("boardId", "deleted", "createdAt" DESC);
