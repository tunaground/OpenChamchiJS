-- AlterTable
ALTER TABLE "User" ADD COLUMN     "roles" TEXT[] DEFAULT ARRAY[]::TEXT[];
