const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function generateTransactionNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `FIN-${timestamp}-${random}`;
}

async function addSampleFinanceData() {
  try {
    console.log("🌱 Adding sample finance data...");

    // Sample income transactions
    const incomeTransactions = [
      {
        type: "INCOME",
        amount: 250000,
        description: "Monthly sales revenue from POS transactions",
        transactionDate: new Date("2024-07-01"),
        paymentMethod: "BANK_TRANSFER",
        incomeSource: "SALES",
        payerName: "Various Customers",
      },
      {
        type: "INCOME",
        amount: 50000,
        description: "Service fees from product consultations",
        transactionDate: new Date("2024-07-05"),
        paymentMethod: "CASH",
        incomeSource: "SERVICES",
        payerName: "Consultation Clients",
      },
      {
        type: "INCOME",
        amount: 100000,
        description: "Business loan from bank",
        transactionDate: new Date("2024-07-10"),
        paymentMethod: "BANK_TRANSFER",
        incomeSource: "OTHER",
        payerName: "First Bank Nigeria",
      },
      {
        type: "INCOME",
        amount: 75000,
        description: "Commission from supplier partnerships",
        transactionDate: new Date("2024-07-15"),
        paymentMethod: "BANK_TRANSFER",
        incomeSource: "COMMISSIONS",
        payerName: "Supplier Partners",
      },
      {
        type: "INCOME",
        amount: 30000,
        description: "Rental income from storage space",
        transactionDate: new Date("2024-07-20"),
        paymentMethod: "CASH",
        incomeSource: "OTHER",
        payerName: "Storage Tenant",
      },
      {
        type: "INCOME",
        amount: 45000,
        description: "Investment returns from business savings",
        transactionDate: new Date("2024-07-25"),
        paymentMethod: "BANK_TRANSFER",
        incomeSource: "INVESTMENTS",
        payerName: "Investment Account",
      },
    ];

    // Sample expense transactions
    const expenseTransactions = [
      {
        type: "EXPENSE",
        amount: 80000,
        description: "Monthly rent for store location",
        transactionDate: new Date("2024-07-01"),
        paymentMethod: "BANK_TRANSFER",
        expenseType: "RENT",
        vendorName: "Property Management Ltd",
      },
      {
        type: "EXPENSE",
        amount: 25000,
        description: "Electricity and water utilities",
        transactionDate: new Date("2024-07-03"),
        paymentMethod: "BANK_TRANSFER",
        expenseType: "UTILITIES",
        vendorName: "Ikeja Electric",
      },
      {
        type: "EXPENSE",
        amount: 150000,
        description: "Staff salaries for July",
        transactionDate: new Date("2024-07-05"),
        paymentMethod: "BANK_TRANSFER",
        expenseType: "SALARIES",
        vendorName: "Staff Payroll",
      },
      {
        type: "EXPENSE",
        amount: 60000,
        description: "Inventory restocking - electronics",
        transactionDate: new Date("2024-07-08"),
        paymentMethod: "BANK_TRANSFER",
        expenseType: "INVENTORY_PURCHASES",
        vendorName: "Tech Suppliers Ltd",
      },
      {
        type: "EXPENSE",
        amount: 35000,
        description: "Marketing campaign for new products",
        transactionDate: new Date("2024-07-12"),
        paymentMethod: "CASH",
        expenseType: "MARKETING",
        vendorName: "Digital Marketing Agency",
      },
      {
        type: "EXPENSE",
        amount: 20000,
        description: "Equipment maintenance and repairs",
        transactionDate: new Date("2024-07-18"),
        paymentMethod: "CASH",
        expenseType: "MAINTENANCE",
        vendorName: "Equipment Repair Services",
      },
      {
        type: "EXPENSE",
        amount: 40000,
        description: "Business insurance premium",
        transactionDate: new Date("2024-07-22"),
        paymentMethod: "BANK_TRANSFER",
        expenseType: "INSURANCE",
        vendorName: "Insurance Company",
      },
      {
        type: "EXPENSE",
        amount: 15000,
        description: "Office supplies and stationery",
        transactionDate: new Date("2024-07-26"),
        paymentMethod: "CASH",
        expenseType: "OFFICE_SUPPLIES",
        vendorName: "Office Supplies Store",
      },
    ];

    // Get the first user to use as createdBy
    const adminUser = await prisma.user.findFirst();

    if (!adminUser) {
      console.error("❌ No users found. Please create a user first.");
      return;
    }

    console.log(
      `👤 Using admin user: ${adminUser.firstName} ${adminUser.lastName}`
    );

    // Add income transactions
    console.log("💰 Adding income transactions...");
    for (const incomeData of incomeTransactions) {
      const transactionNumber = await generateTransactionNumber();

      const _transaction = await prisma.financialTransaction.create({
        data: {
          transactionNumber,
          type: incomeData.type,
          amount: incomeData.amount,
          description: incomeData.description,
          transactionDate: incomeData.transactionDate,
          paymentMethod: incomeData.paymentMethod,
          createdBy: adminUser.id,
          incomeDetails: {
            create: {
              incomeSource: incomeData.incomeSource,
              payerName: incomeData.payerName,
            },
          },
        },
      });

      console.log(
        `✅ Added income: ${incomeData.description} - ₦${incomeData.amount.toLocaleString()}`
      );
    }

    // Add expense transactions
    console.log("💸 Adding expense transactions...");
    for (const expenseData of expenseTransactions) {
      const transactionNumber = await generateTransactionNumber();

      const _transaction = await prisma.financialTransaction.create({
        data: {
          transactionNumber,
          type: expenseData.type,
          amount: expenseData.amount,
          description: expenseData.description,
          transactionDate: expenseData.transactionDate,
          paymentMethod: expenseData.paymentMethod,
          createdBy: adminUser.id,
          expenseDetails: {
            create: {
              expenseType: expenseData.expenseType,
              vendorName: expenseData.vendorName,
            },
          },
        },
      });

      console.log(
        `✅ Added expense: ${expenseData.description} - ₦${expenseData.amount.toLocaleString()}`
      );
    }

    // Calculate totals
    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const totalExpenses = expenseTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const netIncome = totalIncome - totalExpenses;

    console.log("\n📊 Sample Finance Data Summary:");
    console.log(`💰 Total Income: ₦${totalIncome.toLocaleString()}`);
    console.log(`💸 Total Expenses: ₦${totalExpenses.toLocaleString()}`);
    console.log(`📈 Net Income: ₦${netIncome.toLocaleString()}`);
    console.log(`📅 Period: July 2024`);
    console.log(
      `📝 Transactions Added: ${incomeTransactions.length + expenseTransactions.length}`
    );

    console.log("\n✅ Sample finance data added successfully!");
    console.log(
      "🎯 You can now view real financial data in your finance reports."
    );
  } catch (error) {
    console.error("❌ Error adding sample finance data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addSampleFinanceData();
