-- DropIndex
DROP INDEX "Notice_boardId_idx";

-- DropIndex
DROP INDEX "Thread_boardId_idx";

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Notice_boardId_deleted_pinned_createdAt_idx" ON "Notice"("boardId", "deleted", "pinned", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Response_threadId_deleted_visible_seq_idx" ON "Response"("threadId", "deleted", "visible", "seq");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Thread_boardId_published_deleted_top_updatedAt_idx" ON "Thread"("boardId", "published", "deleted", "top" DESC, "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");
