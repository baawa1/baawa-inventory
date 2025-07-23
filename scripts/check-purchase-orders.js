const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkPurchaseOrders() {
  try {
    console.log("🔍 Checking existing purchase orders...\n");

    // Get all purchase orders
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      take: 10,
      include: {
        suppliers: {
          select: {
            id: true,
            name: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
        purchaseOrderItems: {
          include: {
            products: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    console.log(`📋 Found ${purchaseOrders.length} purchase orders:\n`);

    purchaseOrders.forEach((po, index) => {
      console.log(`${index + 1}. ID: ${po.id}`);
      console.log(`   Order Number: ${po.orderNumber}`);
      console.log(`   Supplier: ${po.suppliers?.name || "N/A"}`);
      console.log(`   Status: ${po.status}`);
      console.log(`   Total Amount: ₦${po.totalAmount}`);
      console.log(`   Items: ${po.purchaseOrderItems.length}`);
      console.log(
        `   Created by: ${po.users?.firstName} ${po.users?.lastName} (${po.users?.role})`
      );
      console.log("");
    });

    // Check if ID 151 exists
    const specificOrder = await prisma.purchaseOrder.findUnique({
      where: { id: 151 },
      include: {
        suppliers: true,
        users: true,
        purchaseOrderItems: true,
      },
    });

    if (specificOrder) {
      console.log("✅ Purchase order with ID 151 exists!");
      console.log(`   Order Number: ${specificOrder.orderNumber}`);
      console.log(`   Status: ${specificOrder.status}`);
    } else {
      console.log("❌ Purchase order with ID 151 does not exist.");
      if (purchaseOrders.length > 0) {
        console.log(`   Try using ID: ${purchaseOrders[0].id}`);
      }
    }
  } catch (error) {
    console.error("❌ Error checking purchase orders:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPurchaseOrders();
