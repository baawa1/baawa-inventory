const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixNanEstimatedImpact() {
  try {
    console.log("Starting to fix NaN estimated impact values...");

    // Get all stock reconciliation items with potential NaN values
    const items = await prisma.stockReconciliationItem.findMany({
      include: {
        product: {
          select: {
            id: true,
            cost: true,
          },
        },
      },
    });

    console.log(`Found ${items.length} reconciliation items to check`);

    let fixedCount = 0;

    for (const item of items) {
      let needsUpdate = false;
      let newEstimatedImpact = item.estimatedImpact;

      // Check if estimatedImpact is NaN or needs recalculation
      if (
        item.estimatedImpact === null ||
        item.estimatedImpact === undefined ||
        isNaN(Number(item.estimatedImpact))
      ) {
        // Recalculate based on discrepancy and product cost
        const productCost = Number(item.product?.cost) || 0;
        const discrepancy = item.discrepancy;
        newEstimatedImpact = discrepancy * productCost;

        // Ensure we don't store NaN
        if (isNaN(newEstimatedImpact)) {
          newEstimatedImpact = 0;
        }

        needsUpdate = true;
      }

      if (needsUpdate) {
        await prisma.stockReconciliationItem.update({
          where: { id: item.id },
          data: { estimatedImpact: newEstimatedImpact },
        });
        fixedCount++;
        console.log(
          `Fixed item ${item.id}: ${item.estimatedImpact} -> ${newEstimatedImpact}`
        );
      }
    }

    console.log(
      `\n✅ Fixed ${fixedCount} items with NaN or invalid estimated impact values`
    );
    console.log("Database cleanup completed successfully!");
  } catch (error) {
    console.error("Error fixing NaN estimated impact values:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
fixNanEstimatedImpact();
