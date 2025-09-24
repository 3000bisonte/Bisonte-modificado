import 'server-only'
import { PrismaClient } from "@prisma/client";

// Global is used here to maintain a cached connection across hot reloads in development
// This prevents connection limit issues during development
const globalForPrisma = global;

import { env } from "@/lib/env";
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
