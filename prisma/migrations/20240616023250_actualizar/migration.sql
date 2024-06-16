-- CreateTable
CREATE TABLE "Usuario" (
    "id" SERIAL NOT NULL,
    "nombreCompleto" VARCHAR(20) NOT NULL,
    "email" VARCHAR(50) NOT NULL,
    "contrasena" VARCHAR(200) NOT NULL,
    "fotoPerfil" TEXT,
    "fotoExtension" VARCHAR(4),
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "rol" VARCHAR(50) NOT NULL DEFAULT 'usuario',
    "createAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pantalla" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(20) NOT NULL,
    "mensajeActual" VARCHAR(50) DEFAULT '',
    "mensajeDefecto" VARCHAR(50) DEFAULT '',
    "habilitada" BOOLEAN NOT NULL DEFAULT true,
    "createAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pantalla_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioPantalla" (
    "usuarioId" INTEGER NOT NULL,
    "pantallaId" INTEGER NOT NULL,

    CONSTRAINT "UsuarioPantalla_pkey" PRIMARY KEY ("usuarioId","pantallaId")
);

-- CreateTable
CREATE TABLE "Cron" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "Cron_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CronUsuario" (
    "cronId" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "pantallaId" INTEGER NOT NULL,

    CONSTRAINT "CronUsuario_pkey" PRIMARY KEY ("cronId","usuarioId","pantallaId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pantalla_nombre_key" ON "Pantalla"("nombre");

-- AddForeignKey
ALTER TABLE "UsuarioPantalla" ADD CONSTRAINT "UsuarioPantalla_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioPantalla" ADD CONSTRAINT "UsuarioPantalla_pantallaId_fkey" FOREIGN KEY ("pantallaId") REFERENCES "Pantalla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CronUsuario" ADD CONSTRAINT "CronUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CronUsuario" ADD CONSTRAINT "CronUsuario_cronId_fkey" FOREIGN KEY ("cronId") REFERENCES "Cron"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CronUsuario" ADD CONSTRAINT "CronUsuario_pantallaId_fkey" FOREIGN KEY ("pantallaId") REFERENCES "Pantalla"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
