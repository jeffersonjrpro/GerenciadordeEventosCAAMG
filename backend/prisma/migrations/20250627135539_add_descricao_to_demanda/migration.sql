-- AlterTable
ALTER TABLE "demandas" ADD COLUMN     "descricao" TEXT;

-- AddForeignKey
ALTER TABLE "setores" ADD CONSTRAINT "setores_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
