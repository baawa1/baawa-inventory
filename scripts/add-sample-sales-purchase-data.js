const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function generateTransactionNumber() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `TXN-${timestamp}-${random}`;
}

async function addSampleSalesAndPurchaseData() {
  try {
    console.log("🛒 Adding sample sales and purchase data...");

    // Get admin user
    const adminUser = await prisma.user.findFirst();
    if (!adminUser) {
      console.error("❌ No users found. Please create a user first.");
      return;
    }

    // Get some products for sales and purchases
    const products = await prisma.product.findMany({ take: 5 });
    if (products.length === 0) {
      console.log("⚠️  No products found. Creating sample products first...");

      // Create sample products
      const sampleProducts = [
        {
          name: "Laptop",
          sku: "LAP001",
          price: 150000,
          cost: 120000,
          stock: 10,
        },
        {
          name: "Smartphone",
          sku: "PHN001",
          price: 80000,
          cost: 60000,
          stock: 15,
        },
        {
          name: "Headphones",
          sku: "HP001",
          price: 25000,
          cost: 18000,
          stock: 20,
        },
        { name: "Tablet", sku: "TAB001", price: 120000, cost: 95000, stock: 8 },
        { name: "Mouse", sku: "MS001", price: 8000, cost: 5000, stock: 30 },
      ];

      for (const productData of sampleProducts) {
        await prisma.product.create({
          data: {
            ...productData,
            description: `Sample ${productData.name}`,
            minStock: 5,
            status: PRODUCT_STATUS.ACTIVE,
            tags: [],

          },
        });
      }

      console.log("✅ Sample products created");
    }

    // Get updated products
    const updatedProducts = await prisma.product.findMany({ take: 5 });

    // Sample sales transactions
    const salesTransactions = [
      {
        customer_name: "John Doe",
        customer_email: "john@example.com",
        customer_phone: "08012345678",
        subtotal: 175000,
        tax_amount: 8750,
        discount_amount: 5000,
        total_amount: 178750,
        payment_method: "CARD",
        payment_status: "paid",
        transaction_type: "sale",
        items: [
          {
            productId: updatedProducts[0].id,
            quantity: 1,
            unit_price: 150000,
            total_price: 150000,
          },
          {
            productId: updatedProducts[2].id,
            quantity: 1,
            unit_price: 25000,
            total_price: 25000,
          },
        ],
      },
      {
        customer_name: "Jane Smith",
        customer_email: "jane@example.com",
        customer_phone: "08087654321",
        subtotal: 88000,
        tax_amount: 4400,
        discount_amount: 0,
        total_amount: 92400,
        payment_method: "CASH",
        payment_status: "paid",
        transaction_type: "sale",
        items: [
          {
            productId: updatedProducts[1].id,
            quantity: 1,
            unit_price: 80000,
            total_price: 80000,
          },
          {
            productId: updatedProducts[4].id,
            quantity: 1,
            unit_price: 8000,
            total_price: 8000,
          },
        ],
      },
      {
        customer_name: "Mike Johnson",
        customer_email: "mike@example.com",
        customer_phone: "08055555555",
        subtotal: 120000,
        tax_amount: 6000,
        discount_amount: 10000,
        total_amount: 116000,
        payment_method: "BANK_TRANSFER",
        payment_status: "paid",
        transaction_type: "sale",
        items: [
          {
            productId: updatedProducts[3].id,
            quantity: 1,
            unit_price: 120000,
            total_price: 120000,
          },
        ],
      },
    ];

    // Sample stock additions (purchases)
    const stockAdditions = [
      {
        productId: updatedProducts[0].id,
        quantity: 5,
        costPerUnit: 120000,
        totalCost: 600000,
        purchaseDate: new Date("2024-07-15"),
        notes: "Bulk laptop purchase for Q3",
        referenceNo: "PO-LAP-001",
      },
      {
        productId: updatedProducts[1].id,
        quantity: 10,
        costPerUnit: 60000,
        totalCost: 600000,
        purchaseDate: new Date("2024-07-18"),
        notes: "Smartphone inventory restock",
        referenceNo: "PO-PHN-001",
      },
      {
        productId: updatedProducts[2].id,
        quantity: 15,
        costPerUnit: 18000,
        totalCost: 270000,
        purchaseDate: new Date("2024-07-20"),
        notes: "Headphones for upcoming promotion",
        referenceNo: "PO-HP-001",
      },
    ];

    // Add sales transactions
    console.log("💰 Adding sales transactions...");
    for (const saleData of salesTransactions) {
      const transactionNumber = await generateTransactionNumber();

      const sale = await prisma.salesTransaction.create({
        data: {
          transaction_number: transactionNumber,
          subtotal: saleData.subtotal,
          tax_amount: saleData.tax_amount,
          discount_amount: saleData.discount_amount,
          total_amount: saleData.total_amount,
          payment_method: saleData.payment_method,
          payment_status: saleData.payment_status,
          transaction_type: saleData.transaction_type,
          customer_name: saleData.customer_name,
          customer_email: saleData.customer_email,
          customer_phone: saleData.customer_phone,
          user_id: adminUser.id,
        },
      });

      // Add sales items
      for (const itemData of saleData.items) {
        await prisma.salesItem.create({
          data: {
            transaction_id: sale.id,
            product_id: itemData.productId,
            quantity: itemData.quantity,
            unit_price: itemData.unit_price,
            total_price: itemData.total_price,
            discount_amount: 0,
          },
        });
      }

      console.log(
        `✅ Added sale: ${saleData.customer_name} - ₦${saleData.total_amount.toLocaleString()}`
      );
    }

    // Add stock additions (purchases)
    console.log("📦 Adding stock additions (purchases)...");
    for (const purchaseData of stockAdditions) {
      await prisma.stockAddition.create({
        data: {
          productId: purchaseData.productId,
          quantity: purchaseData.quantity,
          costPerUnit: purchaseData.costPerUnit,
          totalCost: purchaseData.totalCost,
          purchaseDate: purchaseData.purchaseDate,
          notes: purchaseData.notes,
          referenceNo: purchaseData.referenceNo,
          createdById: adminUser.id,
        },
      });

      console.log(
        `✅ Added purchase: ${purchaseData.referenceNo} - ₦${purchaseData.totalCost.toLocaleString()}`
      );
    }

    // Calculate totals
    const totalSales = salesTransactions.reduce(
      (sum, sale) => sum + sale.total_amount,
      0
    );
    const totalPurchases = stockAdditions.reduce(
      (sum, purchase) => sum + purchase.totalCost,
      0
    );

    console.log("\n📊 Sales and Purchase Data Summary:");
    console.log(`💰 Total Sales: ₦${totalSales.toLocaleString()}`);
    console.log(`📦 Total Purchases: ₦${totalPurchases.toLocaleString()}`);
    console.log(
      `📈 Net Cash Flow: ₦${(totalSales - totalPurchases).toLocaleString()}`
    );
    console.log(`📝 Sales Transactions: ${salesTransactions.length}`);
    console.log(`📦 Purchase Orders: ${stockAdditions.length}`);

    console.log("\n✅ Sample sales and purchase data added successfully!");
    console.log(
      "🎯 Your finance reports will now include real sales and purchase data."
    );
  } catch (error) {
    console.error("❌ Error adding sample sales and purchase data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addSampleSalesAndPurchaseData();
