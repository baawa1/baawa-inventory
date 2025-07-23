const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_FINANCIAL_CATEGORIES = {
  EXPENSE: [
    {
      name: "Salary Payments",
      type: "EXPENSE",
      description: "Employee salary disbursements",
    },
    {
      name: "Transport Fees",
      type: "EXPENSE",
      description: "Vehicle maintenance, fuel, delivery costs",
    },
    {
      name: "Utility Bills",
      type: "EXPENSE",
      description: "Electricity, water, internet, phone bills",
    },
    {
      name: "Service Charges",
      type: "EXPENSE",
      description: "Bank charges, insurance, legal fees",
    },
    {
      name: "Rent & Lease",
      type: "EXPENSE",
      description: "Office/store rent, equipment leasing",
    },
    {
      name: "Marketing & Advertising",
      type: "EXPENSE",
      description: "Digital ads, print materials, promotions",
    },
    {
      name: "Office Supplies",
      type: "EXPENSE",
      description: "Stationery, equipment, maintenance",
    },
    {
      name: "Miscellaneous",
      type: "EXPENSE",
      description: "Other business expenses",
    },
  ],
  INCOME: [
    {
      name: "Sales Revenue",
      type: "INCOME",
      description: "Revenue from product sales",
    },
    {
      name: "Personal Investment",
      type: "INCOME",
      description: "Owner's capital injections",
    },
    {
      name: "Business Loans",
      type: "INCOME",
      description: "Bank loans, credit lines, financing",
    },
    {
      name: "Investment Income",
      type: "INCOME",
      description: "Interest, dividends, returns",
    },
    {
      name: "Other Income",
      type: "INCOME",
      description: "Commissions, rebates, refunds",
    },
    {
      name: "Grants & Subsidies",
      type: "INCOME",
      description: "Government or private grants",
    },
  ],
};

async function seedFinancialCategories() {
  console.log("🌱 Seeding financial categories...");

  try {
    // Seed expense categories
    for (const category of DEFAULT_FINANCIAL_CATEGORIES.EXPENSE) {
      const existing = await prisma.financialCategory.findFirst({
        where: {
          name: category.name,
          type: category.type,
        },
      });

      if (existing) {
        await prisma.financialCategory.update({
          where: { id: existing.id },
          data: {
            description: category.description,
            isActive: true,
          },
        });
        console.log(`✅ Updated expense category: ${category.name}`);
      } else {
        await prisma.financialCategory.create({
          data: {
            name: category.name,
            type: category.type,
            description: category.description,
            isActive: true,
          },
        });
        console.log(`✅ Created expense category: ${category.name}`);
      }
    }

    // Seed income categories
    for (const category of DEFAULT_FINANCIAL_CATEGORIES.INCOME) {
      const existing = await prisma.financialCategory.findFirst({
        where: {
          name: category.name,
          type: category.type,
        },
      });

      if (existing) {
        await prisma.financialCategory.update({
          where: { id: existing.id },
          data: {
            description: category.description,
            isActive: true,
          },
        });
        console.log(`✅ Updated income category: ${category.name}`);
      } else {
        await prisma.financialCategory.create({
          data: {
            name: category.name,
            type: category.type,
            description: category.description,
            isActive: true,
          },
        });
        console.log(`✅ Created income category: ${category.name}`);
      }
    }

    console.log("🎉 Financial categories seeded successfully!");

    // Display summary
    const expenseCount = await prisma.financialCategory.count({
      where: { type: "EXPENSE", isActive: true },
    });
    const incomeCount = await prisma.financialCategory.count({
      where: { type: "INCOME", isActive: true },
    });

    console.log(`📊 Summary:`);
    console.log(`   - ${expenseCount} expense categories`);
    console.log(`   - ${incomeCount} income categories`);
    console.log(`   - ${expenseCount + incomeCount} total categories`);

  } catch (error) {
    console.error("❌ Error seeding financial categories:", error);
    throw error;
  }
}

seedFinancialCategories()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });