#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanupTestAccounts(allData = false) {
  console.log("🧹 Cleaning up test accounts...");

  try {
    // Find and delete test accounts created in the last 24 hours (or all if --all flag)
    const timeFilter = allData
      ? new Date(0)
      : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const timeDescription = allData ? "all time" : "last 24 hours";
    console.log(`📅 Cleaning up test accounts from ${timeDescription}...`);

    // Patterns and their broad DB filter (use contains/startsWith)
    const testPatterns = [
      { regex: /^test-.*@example\.com$/, db: { contains: "@example.com" } },
      { regex: /^test\d*@example\.com$/, db: { contains: "test" } },
      { regex: /^test@example\.com$/, db: { equals: "test@example.com" } },
      { regex: /^test2@example\.com$/, db: { equals: "test2@example.com" } },
      {
        regex: /^unverified-.*@example\.com$/,
        db: { contains: "unverified-" },
      },
      { regex: /^dashboard-.*@example\.com$/, db: { contains: "dashboard-" } },
      { regex: /^pos-.*@example\.com$/, db: { contains: "pos-" } },
      { regex: /^inventory-.*@example\.com$/, db: { contains: "inventory-" } },
      { regex: /^admin-.*@example\.com$/, db: { contains: "admin-" } },
      { regex: /^login-.*@example\.com$/, db: { contains: "login-" } },
      { regex: /^session-.*@example\.com$/, db: { contains: "session-" } },
      { regex: /^resend-.*@example\.com$/, db: { contains: "resend-" } },
      // Match all baawapay+* test accounts
      { regex: /^baawapay\+.*@gmail\.com$/, db: { contains: "baawapay+" } },
    ];

    let deletedCount = 0;

    for (const { regex, db } of testPatterns) {
      // Get candidates from DB
      const users = await prisma.user.findMany({
        where: {
          email: db,
          ...(allData ? {} : { createdAt: { gte: timeFilter } }),
        },
      });
      // Filter with regex
      const matchedUsers = users.filter((u) => regex.test(u.email));
      if (matchedUsers.length > 0) {
        console.log(
          `📧 Found ${matchedUsers.length} test users with pattern: ${regex}`
        );
        // Delete related data first
        for (const user of matchedUsers) {
          await prisma.auditLog.deleteMany({
            where: {
              user_id: user.id,
            },
          });
          await prisma.rateLimit.deleteMany({
            where: { key: user.email },
          });
          await prisma.sessionBlacklist.deleteMany({
            where: { userId: user.id },
          });
        }
        // Delete the users
        const deleteResult = await prisma.user.deleteMany({
          where: {
            id: { in: matchedUsers.map((u) => u.id) },
          },
        });
        deletedCount += deleteResult.count;
        console.log(
          `✅ Deleted ${deleteResult.count} users with pattern: ${regex}`
        );
      }
    }

    // Also delete any test accounts created in the last 24 hours with timestamp in email
    const timestampPattern = /^\d+@example\.com$/;
    const timestampUsers = await prisma.user.findMany({
      where: {
        email: { contains: "@example.com" },
        createdAt: { gte: timeFilter },
      },
    });
    const matchedTimestampUsers = timestampUsers.filter((u) =>
      timestampPattern.test(u.email)
    );
    if (matchedTimestampUsers.length > 0) {
      console.log(
        `📧 Found ${matchedTimestampUsers.length} test users with timestamp pattern`
      );
      for (const user of matchedTimestampUsers) {
        await prisma.auditLog.deleteMany({
          where: {
            user_id: user.id,
          },
        });
        await prisma.rateLimit.deleteMany({ where: { key: user.email } });
        await prisma.sessionBlacklist.deleteMany({
          where: { userId: user.id },
        });
      }
      const deleteResult = await prisma.user.deleteMany({
        where: { id: { in: matchedTimestampUsers.map((u) => u.id) } },
      });
      deletedCount += deleteResult.count;
      console.log(
        `✅ Deleted ${deleteResult.count} users with timestamp pattern`
      );
    }

    console.log(
      `🎉 Cleanup complete! Deleted ${deletedCount} test accounts and related data.`
    );
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  const allFlag = process.argv.includes("--all");
  cleanupTestAccounts(allFlag);
}

module.exports = { cleanupTestAccounts };
