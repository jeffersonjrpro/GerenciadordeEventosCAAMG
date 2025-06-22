-- CreateTable
CREATE TABLE "sub_eventos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "dataHora" TIMESTAMP(3) NOT NULL,
    "local" TEXT,
    "limitePorConvidado" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "eventoId" TEXT NOT NULL,

    CONSTRAINT "sub_eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumos" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convidadoId" TEXT NOT NULL,
    "subEventoId" TEXT NOT NULL,

    CONSTRAINT "consumos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "consumos_convidadoId_subEventoId_key" ON "consumos"("convidadoId", "subEventoId");

-- AddForeignKey
ALTER TABLE "sub_eventos" ADD CONSTRAINT "sub_eventos_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumos" ADD CONSTRAINT "consumos_convidadoId_fkey" FOREIGN KEY ("convidadoId") REFERENCES "guests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumos" ADD CONSTRAINT "consumos_subEventoId_fkey" FOREIGN KEY ("subEventoId") REFERENCES "sub_eventos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
