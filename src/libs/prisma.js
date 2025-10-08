import 'server-only'

import { PrismaClient } from "@prisma/client";

import { env } from "@/lib/env";

// Advertencia clara si la cadena apunta a HOST genérico o placeholders comunes.
const maybePlaceholder = typeof env.DATABASE_URL === 'string' && /HOST:5432|USER:PASSWORD|DBNAME/.test(env.DATABASE_URL);
if (maybePlaceholder) {
  // eslint-disable-next-line no-useless-escape
  console.warn('[PRISMA WARNING] DATABASE_URL parece un placeholder o apunta a HOST:5432. Actualiza tu .env / .env.local. Valor actual:', env.DATABASE_URL);
}

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
