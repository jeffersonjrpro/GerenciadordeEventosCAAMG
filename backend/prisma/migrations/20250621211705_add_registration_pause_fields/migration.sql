-- AlterTable
ALTER TABLE "events" ADD COLUMN     "registrationPauseUntil" TIMESTAMP(3),
ADD COLUMN     "registrationPaused" BOOLEAN NOT NULL DEFAULT false;
