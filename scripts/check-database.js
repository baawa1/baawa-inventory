const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log("🔍 Checking database...");

    // Test connection
    await prisma.$connect();
    console.log("✅ Database connection successful");

    // Check users table
    const userCount = await prisma.user.count();
    console.log(`👥 Users in database: ${userCount}`);

    if (userCount > 0) {
      const users = await prisma.user.findMany({
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
        },
      });

      console.log("📋 Sample users:");
      users.forEach((user) => {
        console.log(
          `   - ${user.firstName} ${user.lastName} (${user.email}) - ${user.role}`
        );
      });
    }

    // Check financial transactions
    const transactionCount = await prisma.financialTransaction.count();
    console.log(`💰 Financial transactions: ${transactionCount}`);

    // Check other tables
    const expenseCount = await prisma.expenseDetail.count();
    const incomeCount = await prisma.incomeDetail.count();
    console.log(`💸 Expense details: ${expenseCount}`);
    console.log(`📈 Income details: ${incomeCount}`);
  } catch (error) {
    console.error("❌ Database check failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkDatabase();
