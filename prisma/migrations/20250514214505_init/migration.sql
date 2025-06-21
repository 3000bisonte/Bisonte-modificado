-- CreateTable
CREATE TABLE `Ciudad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `codigo_postal` VARCHAR(10) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Remitente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `tipo_documento` VARCHAR(10) NOT NULL,
    `numero_documento` VARCHAR(20) NOT NULL,
    `celular` VARCHAR(15) NOT NULL,
    `direccion_recogida` VARCHAR(255) NOT NULL,
    `detalle_direccion` VARCHAR(255) NULL,
    `recomendaciones` TEXT NULL,

    UNIQUE INDEX `Remitente_numero_documento_key`(`numero_documento`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Destinatario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `tipo_documento` VARCHAR(10) NOT NULL,
    `numero_documento` VARCHAR(20) NOT NULL,
    `correo` VARCHAR(100) NOT NULL,
    `celular` VARCHAR(15) NOT NULL,
    `direccion_entrega` VARCHAR(255) NOT NULL,
    `detalleDireccion` VARCHAR(191) NULL,
    `noProhibidos` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TipoProducto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Envio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `remitente_id` INTEGER NOT NULL,
    `destinatario_id` INTEGER NOT NULL,
    `ciudad_origen_id` INTEGER NOT NULL,
    `ciudad_destino_id` INTEGER NOT NULL,
    `tipo_envio` VARCHAR(50) NOT NULL,
    `alto` DECIMAL(5, 2) NOT NULL,
    `ancho` DECIMAL(5, 2) NOT NULL,
    `largo` DECIMAL(5, 2) NOT NULL,
    `peso` DECIMAL(5, 2) NOT NULL,
    `valor_declarado` DECIMAL(10, 2) NOT NULL,
    `costo_total` DECIMAL(10, 2) NOT NULL,
    `recomendaciones` TEXT NULL,
    `fecha_envio` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EnvioTipoProducto` (
    `envio_id` INTEGER NOT NULL,
    `tipo_producto_id` INTEGER NOT NULL,

    PRIMARY KEY (`envio_id`, `tipo_producto_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Perfil` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NULL,
    `nickname` VARCHAR(100) NULL,
    `correo` VARCHAR(100) NULL,
    `tipo_documento` VARCHAR(10) NULL,
    `numero_documento` VARCHAR(20) NULL,
    `celular` VARCHAR(15) NULL,
    `direccion_recogida` VARCHAR(255) NULL,
    `detalle_direccion` VARCHAR(255) NULL,
    `recomendaciones` TEXT NULL,
    `esAdministrador` BOOLEAN NOT NULL DEFAULT false,
    `esRecolector` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Perfil_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HistorialEnvio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `NumeroGuia` VARCHAR(255) NULL,
    `paymentId` VARCHAR(191) NOT NULL,
    `Origen` VARCHAR(255) NULL,
    `Destino` VARCHAR(255) NULL,
    `DestinatarioId` INTEGER NULL,
    `Destinatario` VARCHAR(255) NULL,
    `Estado` VARCHAR(191) NULL,
    `FechaSolicitud` DATETIME NULL,
    `PerfilId` INTEGER NULL,

    INDEX `PerfilId`(`PerfilId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Envio` ADD CONSTRAINT `Envio_remitente_id_fkey` FOREIGN KEY (`remitente_id`) REFERENCES `Remitente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Envio` ADD CONSTRAINT `Envio_destinatario_id_fkey` FOREIGN KEY (`destinatario_id`) REFERENCES `Destinatario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Envio` ADD CONSTRAINT `Envio_ciudad_origen_id_fkey` FOREIGN KEY (`ciudad_origen_id`) REFERENCES `Ciudad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Envio` ADD CONSTRAINT `Envio_ciudad_destino_id_fkey` FOREIGN KEY (`ciudad_destino_id`) REFERENCES `Ciudad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnvioTipoProducto` ADD CONSTRAINT `EnvioTipoProducto_envio_id_fkey` FOREIGN KEY (`envio_id`) REFERENCES `Envio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `EnvioTipoProducto` ADD CONSTRAINT `EnvioTipoProducto_tipo_producto_id_fkey` FOREIGN KEY (`tipo_producto_id`) REFERENCES `TipoProducto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HistorialEnvio` ADD CONSTRAINT `HistorialEnvio_PerfilId_fkey` FOREIGN KEY (`PerfilId`) REFERENCES `Perfil`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
