const { PrismaClient } = require("@prisma/client");

require("dotenv").config();

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRawUnsafe("SELECT 1");
    console.log("✅ Prisma/Neon OK");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌ Prisma/Neon ERROR", err?.message || err);
  process.exit(1);
});
