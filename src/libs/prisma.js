import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

// Usar una referencia global para Prisma en entorno de desarrollo
const globalForPrisma = globalThis || global; // compatibilidad con diferentes entornos

const prisma = globalForPrisma.prismaGlobal || prismaClientSingleton();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prismaGlobal = prisma;
}

export default prisma;
