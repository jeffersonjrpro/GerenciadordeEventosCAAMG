-- AlterTable
ALTER TABLE "events" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "guests" ADD COLUMN     "confirmedAt" TIMESTAMP(3);
