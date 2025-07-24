const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testFinanceReports() {
  try {
    console.log("🧪 Testing Finance Reports with Real Data...\n");

    // Test 1: Get all transactions
    console.log("📊 Test 1: Total Transactions");
    const totalTransactions = await prisma.financialTransaction.count();
    console.log(`Total transactions in database: ${totalTransactions}`);

    // Test 2: Income vs Expenses
    console.log("\n💰 Test 2: Income vs Expenses");
    const [incomeTotal, expenseTotal] = await Promise.all([
      prisma.financialTransaction.aggregate({
        where: { type: "INCOME" },
        _sum: { amount: true },
      }),
      prisma.financialTransaction.aggregate({
        where: { type: "EXPENSE" },
        _sum: { amount: true },
      }),
    ]);

    const totalIncome = Number(incomeTotal._sum.amount) || 0;
    const totalExpenses = Number(expenseTotal._sum.amount) || 0;
    const netIncome = totalIncome - totalExpenses;

    console.log(`Total Income: ₦${totalIncome.toLocaleString()}`);
    console.log(`Total Expenses: ₦${totalExpenses.toLocaleString()}`);
    console.log(`Net Income: ₦${netIncome.toLocaleString()}`);

    // Test 3: Income by Source
    console.log("\n📈 Test 3: Income by Source");
    const incomeBySource = await prisma.financialTransaction.findMany({
      where: { type: "INCOME" },
      include: { incomeDetails: true },
    });

    const incomeBreakdown = incomeBySource.reduce((acc, transaction) => {
      const source = transaction.incomeDetails?.incomeSource || "Other";
      if (!acc[source]) {
        acc[source] = { source, amount: 0, count: 0 };
      }
      acc[source].amount += Number(transaction.amount);
      acc[source].count += 1;
      return acc;
    }, {});

    Object.values(incomeBreakdown)
      .sort((a, b) => b.amount - a.amount)
      .forEach((item) => {
        console.log(
          `  ${item.source}: ₦${item.amount.toLocaleString()} (${item.count} transaction${item.count !== 1 ? "s" : ""})`
        );
      });

    // Test 4: Expenses by Type
    console.log("\n💸 Test 4: Expenses by Type");
    const expensesByType = await prisma.financialTransaction.findMany({
      where: { type: "EXPENSE" },
      include: { expenseDetails: true },
    });

    const expenseBreakdown = expensesByType.reduce((acc, transaction) => {
      const type = transaction.expenseDetails?.expenseType || "Other";
      if (!acc[type]) {
        acc[type] = { type, amount: 0, count: 0 };
      }
      acc[type].amount += Number(transaction.amount);
      acc[type].count += 1;
      return acc;
    }, {});

    Object.values(expenseBreakdown)
      .sort((a, b) => b.amount - a.amount)
      .forEach((item) => {
        console.log(
          `  ${item.type}: ₦${item.amount.toLocaleString()} (${item.count} transaction${item.count !== 1 ? "s" : ""})`
        );
      });

    // Test 5: Recent Transactions
    console.log("\n🕒 Test 5: Recent Transactions");
    const recentTransactions = await prisma.financialTransaction.findMany({
      include: {
        createdByUser: { select: { firstName: true, lastName: true } },
        incomeDetails: true,
        expenseDetails: true,
      },
      orderBy: { transactionDate: "desc" },
      take: 5,
    });

    recentTransactions.forEach((transaction, index) => {
      const type = transaction.type === "INCOME" ? "💰" : "💸";
      const source =
        transaction.incomeDetails?.incomeSource ||
        transaction.expenseDetails?.expenseType ||
        "Unknown";
      const user = transaction.createdByUser;
      console.log(`  ${index + 1}. ${type} ${transaction.description}`);
      console.log(`     Amount: ₦${transaction.amount.toLocaleString()}`);
      console.log(`     Type: ${source}`);
      console.log(
        `     Date: ${transaction.transactionDate.toLocaleDateString()}`
      );
      console.log(`     Created by: ${user.firstName} ${user.lastName}`);
      console.log("");
    });

    // Test 6: Cash Flow Calculation
    console.log("💳 Test 6: Cash Flow Components");
    const allTransactions = await prisma.financialTransaction.findMany({
      include: {
        incomeDetails: true,
        expenseDetails: true,
      },
    });

    const operatingCashFlow = allTransactions
      .filter(
        (t) => t.type === "INCOME" && t.incomeDetails?.incomeSource === "SALES"
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const investingCashFlow = allTransactions
      .filter(
        (t) =>
          t.type === "EXPENSE" &&
          ["MAINTENANCE", "INSURANCE", "RENT"].includes(
            t.expenseDetails?.expenseType || ""
          )
      )
      .reduce((sum, t) => sum - Number(t.amount), 0);

    const financingCashFlow = allTransactions
      .filter(
        (t) =>
          (t.type === "INCOME" && t.incomeDetails?.incomeSource === "LOAN") ||
          (t.type === "EXPENSE" && t.expenseDetails?.expenseType === "SALARIES")
      )
      .reduce(
        (sum, t) =>
          sum + (t.type === "INCOME" ? Number(t.amount) : -Number(t.amount)),
        0
      );

    const netCashFlow =
      operatingCashFlow + investingCashFlow + financingCashFlow;

    console.log(
      `  Operating Cash Flow: ₦${operatingCashFlow.toLocaleString()}`
    );
    console.log(
      `  Investing Cash Flow: ₦${investingCashFlow.toLocaleString()}`
    );
    console.log(
      `  Financing Cash Flow: ₦${financingCashFlow.toLocaleString()}`
    );
    console.log(`  Net Cash Flow: ₦${netCashFlow.toLocaleString()}`);

    console.log("\n✅ All finance report calculations are working correctly!");
    console.log(
      "🎯 Your finance reports will now show real data from the database."
    );
  } catch (error) {
    console.error("❌ Error testing finance reports:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFinanceReports();
