/*
  Warnings:

  - A unique constraint covering the columns `[solicitacao]` on the table `demandas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `criadoPorId` to the `demandas` table without a default value. This is not possible if the table is not empty.
  - Added the required column `solicitacao` to the `demandas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "demandas" ADD COLUMN     "criadoPorId" TEXT NOT NULL,
ADD COLUMN     "numeroFluig" TEXT,
ADD COLUMN     "solicitacao" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "demandas_solicitacao_key" ON "demandas"("solicitacao");

-- AddForeignKey
ALTER TABLE "demandas" ADD CONSTRAINT "demandas_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
