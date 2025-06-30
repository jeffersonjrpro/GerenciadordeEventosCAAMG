-- DropForeignKey
ALTER TABLE "_UsuariosResponsaveisDemanda" DROP CONSTRAINT "_UsuariosResponsaveisDemanda_B_fkey";

-- AddForeignKey
ALTER TABLE "_UsuariosResponsaveisDemanda" ADD CONSTRAINT "_UsuariosResponsaveisDemanda_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
