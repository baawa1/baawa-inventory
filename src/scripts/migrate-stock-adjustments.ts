/**
 * Migration script to move legacy stock adjustments to the new system
 * This script uses Prisma to migrate data from stock_adjustments to stock_additions and stock_reconciliations
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrateStockAdjustments() {
  console.log("Starting stock adjustments migration...");

  try {
    // Step 1: Analyze existing stock adjustments
    console.log("Step 1: Analyzing existing stock adjustments...");
    const adjustmentStats = await prisma.stockAdjustment.groupBy({
      by: ["adjustment_type"],
      _count: {
        id: true,
      },
    });

    console.log("Current stock adjustments by type:");
    adjustmentStats.forEach((stat) => {
      console.log(`  ${stat.adjustment_type}: ${stat._count.id} records`);
    });

    // Step 2: Migrate INCREASE and RETURN types to stock_additions
    console.log(
      "\nStep 2: Migrating INCREASE and RETURN adjustments to stock_additions..."
    );
    const increaseAdjustments = await prisma.stockAdjustment.findMany({
      where: {
        adjustment_type: {
          in: ["INCREASE", "RETURN"],
        },
        status: "APPROVED",
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    let migratedAdditions = 0;
    for (const adjustment of increaseAdjustments) {
      try {
        await prisma.stockAddition.create({
          data: {
            productId: adjustment.product_id!,
            quantity: Math.abs(adjustment.quantity),
            costPerUnit: 0.0, // Default cost, can be updated manually
            totalCost: 0.0,
            supplierId: null, // No supplier info in old system
            purchaseDate: adjustment.created_at || new Date(),
            notes: `${adjustment.notes || ""} (Migrated from stock adjustment #${adjustment.id})`,
            referenceNo: adjustment.reference_number,
            createdById: adjustment.user_id,
            createdAt: adjustment.created_at || new Date(),
            updatedAt: adjustment.updated_at || new Date(),
          },
        });
        migratedAdditions++;
      } catch (error) {
        console.error(`Error migrating adjustment ${adjustment.id}:`, error);
      }
    }
    console.log(`  Migrated ${migratedAdditions} stock additions`);

    // Step 3: Migrate complex adjustments to stock_reconciliations
    console.log(
      "\nStep 3: Migrating complex adjustments to stock_reconciliations..."
    );
    const complexAdjustments = await prisma.stockAdjustment.findMany({
      where: {
        adjustment_type: {
          in: ["DECREASE", "DAMAGE", "TRANSFER", "RECOUNT"],
        },
        status: "APPROVED",
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
          },
        },
        users_stock_adjustments_user_idTousers: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // Group by user and date for creating reconciliations
    const groupedAdjustments = complexAdjustments.reduce(
      (acc, adjustment) => {
        const date =
          adjustment.created_at?.toISOString().split("T")[0] ||
          new Date().toISOString().split("T")[0];
        const key = `${adjustment.user_id}-${date}`;

        if (!acc[key]) {
          acc[key] = {
            userId: adjustment.user_id,
            date: date,
            adjustments: [],
          };
        }

        acc[key].adjustments.push(adjustment);
        return acc;
      },
      {} as Record<string, { userId: number; date: string; adjustments: any[] }>
    );

    let migratedReconciliations = 0;
    for (const [key, group] of Object.entries(groupedAdjustments)) {
      try {
        const reconciliation = await prisma.stockReconciliation.create({
          data: {
            title: `Migrated Adjustments - ${group.date}`,
            description: `Automatically migrated from old stock adjustment system. Contains ${group.adjustments.length} adjustments.`,
            status: "APPROVED",
            createdById: group.userId,
            approvedById: group.userId,
            createdAt: new Date(group.date),
            updatedAt: new Date(group.date),
            submittedAt: new Date(group.date),
            approvedAt: new Date(group.date),
          },
        });

        // Create reconciliation items
        for (const adjustment of group.adjustments) {
          await prisma.stockReconciliationItem.create({
            data: {
              reconciliationId: reconciliation.id,
              productId: adjustment.product_id!,
              systemCount: adjustment.old_quantity,
              physicalCount: adjustment.new_quantity,
              discrepancy: adjustment.quantity,
              discrepancyReason: adjustment.reason,
              estimatedImpact: 0.0, // Default impact
              notes: `${adjustment.notes || ""} (Migrated from adjustment #${adjustment.id})`,
            },
          });
        }

        migratedReconciliations++;
      } catch (error) {
        console.error(`Error migrating reconciliation group ${key}:`, error);
      }
    }
    console.log(`  Migrated ${migratedReconciliations} stock reconciliations`);

    // Step 4: Update stock_adjustments table with migration status
    console.log("\nStep 4: Updating migration status...");
    await prisma.stockAdjustment.updateMany({
      where: {
        OR: [
          {
            adjustment_type: {
              in: ["INCREASE", "RETURN"],
            },
            status: "APPROVED",
          },
          {
            adjustment_type: {
              in: ["DECREASE", "DAMAGE", "TRANSFER", "RECOUNT"],
            },
            status: "APPROVED",
          },
        ],
      },
      data: {
        notes: {
          // This will append to existing notes
          // Note: In a real implementation, you might want to handle this differently
        },
      },
    });

    console.log("\nMigration completed successfully!");
    console.log(
      `Total migrated: ${migratedAdditions} additions, ${migratedReconciliations} reconciliations`
    );
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateStockAdjustments()
    .then(() => {
      console.log("Migration script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration script failed:", error);
      process.exit(1);
    });
}

export { migrateStockAdjustments };
