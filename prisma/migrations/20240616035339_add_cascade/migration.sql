-- DropForeignKey
ALTER TABLE "CronUsuario" DROP CONSTRAINT "CronUsuario_cronId_fkey";

-- DropForeignKey
ALTER TABLE "CronUsuario" DROP CONSTRAINT "CronUsuario_pantallaId_fkey";

-- DropForeignKey
ALTER TABLE "UsuarioPantalla" DROP CONSTRAINT "UsuarioPantalla_pantallaId_fkey";

-- DropForeignKey
ALTER TABLE "UsuarioPantalla" DROP CONSTRAINT "UsuarioPantalla_usuarioId_fkey";

-- AddForeignKey
ALTER TABLE "UsuarioPantalla" ADD CONSTRAINT "UsuarioPantalla_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPantalla" ADD CONSTRAINT "UsuarioPantalla_pantallaId_fkey" FOREIGN KEY ("pantallaId") REFERENCES "Pantalla"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CronUsuario" ADD CONSTRAINT "CronUsuario_cronId_fkey" FOREIGN KEY ("cronId") REFERENCES "Cron"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CronUsuario" ADD CONSTRAINT "CronUsuario_pantallaId_fkey" FOREIGN KEY ("pantallaId") REFERENCES "Pantalla"("id") ON DELETE CASCADE ON UPDATE CASCADE;
