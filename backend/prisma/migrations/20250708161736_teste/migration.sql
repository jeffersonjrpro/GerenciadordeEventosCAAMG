-- DropForeignKey
ALTER TABLE "empresas" DROP CONSTRAINT "empresas_ownerId_fkey";

-- AddForeignKey
ALTER TABLE "empresas" ADD CONSTRAINT "empresas_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
