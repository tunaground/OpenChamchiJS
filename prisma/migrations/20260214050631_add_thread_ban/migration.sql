-- CreateTable
CREATE TABLE "ThreadBan" (
    "id" TEXT NOT NULL,
    "threadId" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadBan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ThreadBan_threadId_idx" ON "ThreadBan"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadBan_threadId_authorId_key" ON "ThreadBan"("threadId", "authorId");

-- AddForeignKey
ALTER TABLE "ThreadBan" ADD CONSTRAINT "ThreadBan_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
