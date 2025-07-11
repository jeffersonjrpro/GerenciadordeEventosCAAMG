/*
  Warnings:

  - Made the column `codigo` on table `empresas` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "empresas" ALTER COLUMN "codigo" SET NOT NULL;
