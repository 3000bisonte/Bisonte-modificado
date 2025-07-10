-- CreateTable
CREATE TABLE "perfil" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100),
    "celular" VARCHAR(15),
    "ciudad" VARCHAR(100),
    "email" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "esAdministrador" BOOLEAN NOT NULL DEFAULT false,
    "esRecolector" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "perfil_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialEnvio" (
    "id" SERIAL NOT NULL,
    "NumeroGuia" VARCHAR(255),
    "paymentId" TEXT NOT NULL,
    "Origen" VARCHAR(255),
    "Destino" VARCHAR(255),
    "Destinatario" VARCHAR(255),
    "Estado" TEXT,
    "FechaSolicitud" TIMESTAMP(3),
    "perfilId" INTEGER,

    CONSTRAINT "HistorialEnvio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contacto" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "correo" VARCHAR(100) NOT NULL,
    "mensaje" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contacto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "perfil_email_key" ON "perfil"("email");

-- CreateIndex
CREATE INDEX "perfilId" ON "HistorialEnvio"("perfilId");

-- AddForeignKey
ALTER TABLE "HistorialEnvio" ADD CONSTRAINT "HistorialEnvio_perfilId_fkey" FOREIGN KEY ("perfilId") REFERENCES "perfil"("id") ON DELETE SET NULL ON UPDATE CASCADE;
