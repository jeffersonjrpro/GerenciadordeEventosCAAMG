/*
  Warnings:

  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `usuarios` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_agendamentoId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "observacoes" DROP CONSTRAINT "observacoes_autorId_fkey";

-- AlterTable
ALTER TABLE "_UsuariosResponsaveisDemanda" ADD CONSTRAINT "_UsuariosResponsaveisDemanda_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_UsuariosResponsaveisDemanda_AB_unique";

-- AlterTable
ALTER TABLE "demandas" ADD COLUMN     "arquivada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "dataArquivamento" TIMESTAMP(3);

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "usuarios";

-- CreateTable
CREATE TABLE "arquivos_demanda" (
    "id" TEXT NOT NULL,
    "nomeOriginal" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "caminho" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "demandaId" TEXT NOT NULL,
    "uploadPorId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquivos_demanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "dados" JSONB,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "observacoes" ADD CONSTRAINT "observacoes_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos_demanda" ADD CONSTRAINT "arquivos_demanda_demandaId_fkey" FOREIGN KEY ("demandaId") REFERENCES "demandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos_demanda" ADD CONSTRAINT "arquivos_demanda_uploadPorId_fkey" FOREIGN KEY ("uploadPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
