/*
  Warnings:

  - A unique constraint covering the columns `[codigoEmpresa]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerId` to the `empresas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "empresas" ADD COLUMN     "ownerId" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "codigoEmpresa" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_codigoEmpresa_key" ON "users"("codigoEmpresa");

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
