-- AlterTable
ALTER TABLE "events" ADD COLUMN "customSlug" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "events_customSlug_key" ON "events"("customSlug"); 