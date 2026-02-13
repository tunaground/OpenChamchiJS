-- DropForeignKey
ALTER TABLE "Notice" DROP CONSTRAINT "Notice_boardId_fkey";

-- AlterTable
ALTER TABLE "Notice" ALTER COLUMN "boardId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Notice" ADD CONSTRAINT "Notice_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;
