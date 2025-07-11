-- AlterTable
ALTER TABLE "events" ALTER COLUMN "location" DROP NOT NULL,
ALTER COLUMN "isPublic" SET DEFAULT true;

-- CreateTable
CREATE TABLE "palestrantes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT,
    "descricao" TEXT,
    "imagem" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventId" TEXT NOT NULL,

    CONSTRAINT "palestrantes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "palestrantes" ADD CONSTRAINT "palestrantes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
