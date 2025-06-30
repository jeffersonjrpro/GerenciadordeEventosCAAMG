-- CreateEnum
CREATE TYPE "Visibilidade" AS ENUM ('PRIVADO', 'EQUIPE');

-- CreateTable
CREATE TABLE "Agendamento" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "dataFim" TIMESTAMP(3) NOT NULL,
    "categoria" TEXT NOT NULL,
    "lembreteMinutosAntes" INTEGER NOT NULL,
    "criadoPorId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "visibilidade" "Visibilidade" NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agendamento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Agendamento" ADD CONSTRAINT "Agendamento_criadoPorId_fkey" FOREIGN KEY ("criadoPorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
