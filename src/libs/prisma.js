const { PrismaClient } = require("@prisma/client");

const prismaClientSingleton = () => {
  return new PrismaClient();
};

// Usar una referencia global para Prisma en entorno de desarrollo
const globalForPrisma = globalThis || global; // compatibilidad con diferentes entornos

const prisma = globalForPrisma.prismaGlobal || prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaGlobal = prisma;
}

module.exports = prisma;
