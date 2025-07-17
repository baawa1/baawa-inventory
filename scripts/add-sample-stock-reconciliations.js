const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function addSampleStockReconciliations() {
  try {
    console.log("Adding sample stock reconciliations...");

    // Get existing users and products
    const users = await prisma.user.findMany({
      select: { id: true, firstName: true, lastName: true, email: true },
      take: 3,
    });

    const products = await prisma.product.findMany({
      select: { id: true, name: true, sku: true, stock: true, cost: true },
      take: 10,
    });

    if (users.length === 0) {
      console.log("No users found. Please create users first.");
      return;
    }

    if (products.length === 0) {
      console.log("No products found. Please create products first.");
      return;
    }

    console.log(`Found ${users.length} users and ${products.length} products`);

    // Sample reconciliation data
    const sampleReconciliations = [
      {
        title: "Monthly Inventory Count - January 2024",
        description: "Regular monthly stock count for all categories",
        status: "APPROVED",
        notes: "All discrepancies resolved and approved by management",
        createdBy: users[0],
        approvedBy: users[1],
        items: products.slice(0, 5).map((product, index) => ({
          systemCount: product.stock,
          physicalCount: product.stock + (index % 3 === 0 ? 2 : -1),
          discrepancyReason:
            index % 3 === 0
              ? "Found extra items in storage"
              : "Damaged items found",
          notes: `Item ${index + 1} count completed`,
        })),
      },
      {
        title: "Electronics Department Audit",
        description: "Special audit for electronics section",
        status: "PENDING",
        notes: "Pending approval from department head",
        createdBy: users[1],
        items: products.slice(2, 7).map((product, index) => ({
          systemCount: product.stock,
          physicalCount: product.stock + (index % 2 === 0 ? 1 : -2),
          discrepancyReason:
            index % 2 === 0 ? "New shipment arrived" : "Theft reported",
          notes: `Electronics item ${index + 1}`,
        })),
      },
      {
        title: "Warehouse Stock Verification",
        description: "Complete warehouse inventory verification",
        status: "DRAFT",
        notes: "Draft reconciliation - needs review",
        createdBy: users[2],
        items: products.slice(0, 8).map((product, index) => ({
          systemCount: product.stock,
          physicalCount: product.stock + (index % 4 === 0 ? 3 : -1),
          discrepancyReason:
            index % 4 === 0 ? "Bulk order received" : "Expired items removed",
          notes: `Warehouse item ${index + 1}`,
        })),
      },
      {
        title: "End of Year Stock Count",
        description: "Annual comprehensive stock count",
        status: "REJECTED",
        notes: "Rejected due to incomplete documentation",
        createdBy: users[0],
        items: products.slice(3, 6).map((product, index) => ({
          systemCount: product.stock,
          physicalCount: product.stock + (index % 2 === 0 ? -3 : 1),
          discrepancyReason:
            index % 2 === 0
              ? "Major discrepancy found"
              : "Minor adjustment needed",
          notes: `Annual count item ${index + 1}`,
        })),
      },
    ];

    // Create reconciliations
    for (const reconciliationData of sampleReconciliations) {
      const { items, createdBy, approvedBy, ...reconciliationFields } =
        reconciliationData;

      // Create reconciliation
      const reconciliation = await prisma.stockReconciliation.create({
        data: {
          ...reconciliationFields,
          createdById: parseInt(createdBy.id),
          approvedById: approvedBy ? parseInt(approvedBy.id) : null,
          approvedAt: approvedBy ? new Date() : null,
          submittedAt:
            reconciliationFields.status !== "DRAFT" ? new Date() : null,
        },
      });

      console.log(`Created reconciliation: ${reconciliation.title}`);

      // Create reconciliation items
      for (let i = 0; i < items.length; i++) {
        const itemData = items[i];
        const product = products[i % products.length]; // Cycle through products
        const discrepancy = itemData.physicalCount - itemData.systemCount;
        const estimatedImpact = discrepancy * Number(product.cost);

        await prisma.stockReconciliationItem.create({
          data: {
            reconciliationId: reconciliation.id,
            productId: product.id,
            systemCount: itemData.systemCount,
            physicalCount: itemData.physicalCount,
            discrepancy,
            discrepancyReason: itemData.discrepancyReason,
            estimatedImpact,
            notes: itemData.notes,
          },
        });
      }

      console.log(
        `Created ${items.length} items for reconciliation: ${reconciliation.title}`
      );
    }

    console.log("Sample stock reconciliations added successfully!");
    console.log(
      `Created ${sampleReconciliations.length} reconciliations with items`
    );
  } catch (error) {
    console.error("Error adding sample stock reconciliations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
addSampleStockReconciliations();
