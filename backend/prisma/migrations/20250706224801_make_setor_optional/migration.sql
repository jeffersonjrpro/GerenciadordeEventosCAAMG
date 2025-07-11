-- DropForeignKey
ALTER TABLE "demandas" DROP CONSTRAINT "demandas_setorId_fkey";

-- AlterTable
ALTER TABLE "demandas" ALTER COLUMN "setorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "demandas" ADD CONSTRAINT "demandas_setorId_fkey" FOREIGN KEY ("setorId") REFERENCES "setores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
