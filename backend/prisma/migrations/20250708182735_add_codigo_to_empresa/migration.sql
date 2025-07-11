/*
  Warnings:

  - A unique constraint covering the columns `[codigo]` on the table `empresas` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `codigo` to the `empresas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "empresas" ADD COLUMN     "codigo" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "empresas_codigo_key" ON "empresas"("codigo");
