const { PrismaClient } = require("@prisma/client");

async function testPrismaConnection() {
  const prisma = new PrismaClient();

  try {
    console.log("Testing Prisma connection...");
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Prisma connection successful:", result);

    // Test user table access
    const userCount = await prisma.user.count();
    console.log("✅ User table accessible, count:", userCount);
  } catch (error) {
    console.error("❌ Prisma connection failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();
