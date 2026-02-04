-- Enable pg_trgm extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "Thread_title_idx" ON "Thread" USING GIN ("title" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "Thread_username_idx" ON "Thread" USING GIN ("username" gin_trgm_ops);
