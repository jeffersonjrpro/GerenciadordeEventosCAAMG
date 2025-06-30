-- AlterTable
ALTER TABLE "empresas" ADD COLUMN     "createdById" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "dataNascimento" TIMESTAMP(3),
ADD COLUMN     "diasTrabalhados" JSONB,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "eventosTrabalhados" JSONB,
ADD COLUMN     "foiPago" BOOLEAN,
ADD COLUMN     "fotoPerfil" TEXT,
ADD COLUMN     "lastLoginAt" TIMESTAMP(3),
ADD COLUMN     "pagamentos" JSONB,
ADD COLUMN     "pix" TEXT,
ADD COLUMN     "trabalhou" BOOLEAN;

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
