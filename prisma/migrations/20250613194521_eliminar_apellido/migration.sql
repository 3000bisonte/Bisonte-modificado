/*
  Warnings:

  - You are about to drop the column `apellido` on the `Destinatario` table. All the data in the column will be lost.
  - You are about to alter the column `FechaSolicitud` on the `HistorialEnvio` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `Destinatario` DROP COLUMN `apellido`;

-- AlterTable
ALTER TABLE `HistorialEnvio` MODIFY `FechaSolicitud` DATETIME NULL;
