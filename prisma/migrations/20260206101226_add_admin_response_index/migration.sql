-- CreateIndex
CREATE INDEX "Response_boardId_createdAt_id_idx" ON "Response"("boardId", "createdAt" DESC, "id" DESC);
