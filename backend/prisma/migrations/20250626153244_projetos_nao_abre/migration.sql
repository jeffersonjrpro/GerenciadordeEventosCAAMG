/*
  Warnings:

  - You are about to drop the `_UsuariosProprietariosDemanda` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_UsuariosProprietariosDemanda" DROP CONSTRAINT "_UsuariosProprietariosDemanda_A_fkey";

-- DropForeignKey
ALTER TABLE "_UsuariosProprietariosDemanda" DROP CONSTRAINT "_UsuariosProprietariosDemanda_B_fkey";

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "podeGerenciarDemandas" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "_UsuariosProprietariosDemanda";

-- CreateTable
CREATE TABLE "_UsuariosResponsaveisDemanda" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_UsuariosResponsaveisDemanda_AB_unique" ON "_UsuariosResponsaveisDemanda"("A", "B");

-- CreateIndex
CREATE INDEX "_UsuariosResponsaveisDemanda_B_index" ON "_UsuariosResponsaveisDemanda"("B");

-- AddForeignKey
ALTER TABLE "_UsuariosResponsaveisDemanda" ADD CONSTRAINT "_UsuariosResponsaveisDemanda_A_fkey" FOREIGN KEY ("A") REFERENCES "demandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_UsuariosResponsaveisDemanda" ADD CONSTRAINT "_UsuariosResponsaveisDemanda_B_fkey" FOREIGN KEY ("B") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
