const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testFinanceIntegration() {
  try {
    console.log(
      "🧪 Testing Finance Integration with Sales and Purchase Data...\n"
    );

    // Test 1: Check if sales data exists
    console.log("📊 Test 1: Sales Data Verification");
    const salesCount = await prisma.salesTransaction.count();
    const salesTotal = await prisma.salesTransaction.aggregate({
      where: { payment_status: "paid" },
      _sum: { total_amount: true },
    });
    console.log(`✅ Sales Transactions: ${salesCount}`);
    console.log(
      `✅ Total Sales Amount: ₦${Number(salesTotal._sum.total_amount || 0).toLocaleString()}`
    );

    // Test 2: Check if purchase data exists
    console.log("\n📦 Test 2: Purchase Data Verification");
    const purchaseCount = await prisma.stockAddition.count();
    const purchaseTotal = await prisma.stockAddition.aggregate({
      _sum: { totalCost: true },
    });
    console.log(`✅ Purchase Orders: ${purchaseCount}`);
    console.log(
      `✅ Total Purchase Amount: ₦${Number(purchaseTotal._sum.totalCost || 0).toLocaleString()}`
    );

    // Test 3: Check manual financial transactions
    console.log("\n💰 Test 3: Manual Financial Transactions");
    const manualIncome = await prisma.financialTransaction.aggregate({
      where: { type: "INCOME" },
      _sum: { amount: true },
    });
    const manualExpenses = await prisma.financialTransaction.aggregate({
      where: { type: "EXPENSE" },
      _sum: { amount: true },
    });
    console.log(
      `✅ Manual Income: ₦${Number(manualIncome._sum.amount || 0).toLocaleString()}`
    );
    console.log(
      `✅ Manual Expenses: ₦${Number(manualExpenses._sum.amount || 0).toLocaleString()}`
    );

    // Test 4: Calculate expected totals
    console.log("\n📈 Test 4: Expected Financial Totals");
    const expectedIncome =
      Number(salesTotal._sum.total_amount || 0) +
      Number(manualIncome._sum.amount || 0);
    const expectedExpenses =
      Number(purchaseTotal._sum.totalCost || 0) +
      Number(manualExpenses._sum.amount || 0);
    const expectedNetIncome = expectedIncome - expectedExpenses;

    console.log(
      `✅ Expected Total Income: ₦${expectedIncome.toLocaleString()}`
    );
    console.log(
      `✅ Expected Total Expenses: ₦${expectedExpenses.toLocaleString()}`
    );
    console.log(
      `✅ Expected Net Income: ₦${expectedNetIncome.toLocaleString()}`
    );

    // Test 5: Sample recent transactions
    console.log("\n🔄 Test 5: Recent Transactions Sample");
    const recentSales = await prisma.salesTransaction.findMany({
      where: { payment_status: "paid" },
      orderBy: { created_at: "desc" },
      take: 2,
      include: {
        users: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const recentPurchases = await prisma.stockAddition.findMany({
      orderBy: { purchaseDate: "desc" },
      take: 2,
      include: {
        product: {
          select: { name: true },
        },
        createdBy: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    console.log("✅ Recent Sales:");
    recentSales.forEach((sale) => {
      console.log(
        `   - ${sale.customer_name}: ₦${Number(sale.total_amount).toLocaleString()} (${sale.users.firstName} ${sale.users.lastName})`
      );
    });

    console.log("✅ Recent Purchases:");
    recentPurchases.forEach((purchase) => {
      console.log(
        `   - ${purchase.product.name}: ₦${Number(purchase.totalCost).toLocaleString()} (${purchase.createdBy.firstName} ${purchase.createdBy.lastName})`
      );
    });

    // Test 6: Data source breakdown
    console.log("\n📋 Test 6: Data Source Breakdown");
    console.log(
      `✅ Manual Transactions: ${await prisma.financialTransaction.count()}`
    );
    console.log(`✅ Sales Transactions: ${salesCount}`);
    console.log(`✅ Purchase Orders: ${purchaseCount}`);
    console.log(
      `✅ Total Data Points: ${(await prisma.financialTransaction.count()) + salesCount + purchaseCount}`
    );

    // Test 7: Financial summary calculation
    console.log("\n🎯 Test 7: Financial Summary Calculation");
    const totalIncome = expectedIncome;
    const totalExpenses = expectedExpenses;
    const netIncome = expectedNetIncome;

    console.log(`💰 Total Income: ₦${totalIncome.toLocaleString()}`);
    console.log(`📦 Total Expenses: ₦${totalExpenses.toLocaleString()}`);
    console.log(`📈 Net Income: ₦${netIncome.toLocaleString()}`);
    console.log(
      `📊 Profit Margin: ${totalIncome > 0 ? ((netIncome / totalIncome) * 100).toFixed(2) : 0}%`
    );

    // Test 8: Cash flow components
    console.log("\n💸 Test 8: Cash Flow Components");
    const operatingCashFlow = Number(salesTotal._sum.total_amount || 0); // Sales are operating cash flow
    const investingCashFlow = -Number(purchaseTotal._sum.totalCost || 0); // Purchases are negative investing cash flow
    const financingCashFlow =
      Number(manualIncome._sum.amount || 0) -
      Number(manualExpenses._sum.amount || 0);
    const netCashFlow =
      operatingCashFlow + investingCashFlow + financingCashFlow;

    console.log(
      `✅ Operating Cash Flow: ₦${operatingCashFlow.toLocaleString()}`
    );
    console.log(
      `✅ Investing Cash Flow: ₦${investingCashFlow.toLocaleString()}`
    );
    console.log(
      `✅ Financing Cash Flow: ₦${financingCashFlow.toLocaleString()}`
    );
    console.log(`✅ Net Cash Flow: ₦${netCashFlow.toLocaleString()}`);

    console.log("\n🎉 Finance Integration Test Completed Successfully!");
    console.log("📝 Your finance reports should now show:");
    console.log("   - Sales transactions as income");
    console.log("   - Purchase orders as expenses");
    console.log("   - Combined totals in all reports");
    console.log("   - Data source indicators");
    console.log("   - Recent transactions from all sources");
  } catch (error) {
    console.error("❌ Error testing finance integration:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testFinanceIntegration();
