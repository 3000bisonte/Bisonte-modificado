/*
  Warnings:

  - You are about to drop the column `perfilId` on the `HistorialEnvio` table. All the data in the column will be lost.
  - You are about to drop the `perfil` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "HistorialEnvio" DROP CONSTRAINT "HistorialEnvio_perfilId_fkey";

-- DropIndex
DROP INDEX "perfilId";

-- AlterTable
ALTER TABLE "HistorialEnvio" DROP COLUMN "perfilId",
ADD COLUMN     "usuarioId" INTEGER;

-- DropTable
DROP TABLE "perfil";

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100),
    "celular" VARCHAR(15),
    "ciudad" VARCHAR(100),
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255),
    "tokenFecha" TIMESTAMP(3),
    "esAdministrador" BOOLEAN NOT NULL DEFAULT false,
    "esRecolector" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarioId" ON "HistorialEnvio"("usuarioId");

-- AddForeignKey
ALTER TABLE "HistorialEnvio" ADD CONSTRAINT "HistorialEnvio_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
