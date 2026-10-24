-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pushEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "GlobalSettings" ADD COLUMN     "pushWatchLimit" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vapidPrivateKey" TEXT,
ADD COLUMN     "vapidPublicKey" TEXT,
ADD COLUMN     "vapidSubject" TEXT;

-- CreateTable
CREATE TABLE "ThreadWatch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "threadId" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastPushedAt" TIMESTAMP(3),
    "lastViewingAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadWatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "locale" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ThreadWatch_threadId_idx" ON "ThreadWatch"("threadId");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadWatch_userId_threadId_key" ON "ThreadWatch"("userId", "threadId");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

-- AddForeignKey
ALTER TABLE "ThreadWatch" ADD CONSTRAINT "ThreadWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadWatch" ADD CONSTRAINT "ThreadWatch_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

