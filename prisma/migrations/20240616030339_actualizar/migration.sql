/*
  Warnings:

  - The primary key for the `CronUsuario` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `usuarioId` on the `CronUsuario` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "CronUsuario" DROP CONSTRAINT "CronUsuario_usuarioId_fkey";

-- AlterTable
ALTER TABLE "CronUsuario" DROP CONSTRAINT "CronUsuario_pkey",
DROP COLUMN "usuarioId",
ADD CONSTRAINT "CronUsuario_pkey" PRIMARY KEY ("cronId", "pantallaId");
