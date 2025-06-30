-- CreateEnum
CREATE TYPE "UserNivel" AS ENUM ('CHECKIN', 'EDITOR', 'ADMIN', 'PROPRIETARIO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "eventosIds" JSONB,
ADD COLUMN     "nivel" "UserNivel" NOT NULL DEFAULT 'CHECKIN',
ADD COLUMN     "trabalharTodosEventos" BOOLEAN NOT NULL DEFAULT false;
