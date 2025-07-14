import { NextResponse } from "next/server";
import { withAuth, AuthenticatedRequest } from "@/lib/api-middleware";
import { prisma } from "@/lib/db";

// GET /api/inventory/activity/recent - Get recent inventory activity
export const GET = withAuth(
  async (_request: AuthenticatedRequest): Promise<NextResponse> => {
    try {
      // Get recent stock additions
      const recentStockAdditions = await prisma.stockAddition.findMany({
        take: 10,
        orderBy: {
          createdAt: "desc",
        },
        include: {
          product: {
            select: {
              name: true,
              sku: true,
            },
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          supplier: {
            select: {
              name: true,
            },
          },
        },
      });

      // Get recent stock adjustments
      const recentStockAdjustments = await prisma.stockAdjustment.findMany({
        take: 10,
        orderBy: {
          created_at: "desc",
        },
        include: {
          products: {
            select: {
              name: true,
              sku: true,
            },
          },
          users_stock_adjustments_user_idTousers: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Get recent sales
      const recentSales = await prisma.salesTransaction.findMany({
        take: 10,
        orderBy: {
          created_at: "desc",
        },
        include: {
          users: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      // Combine and format activities
      const activities = [
        ...recentStockAdditions.map((addition) => ({
          id: `stock-addition-${addition.id}`,
          type: "stock_in" as const,
          description: `Added ${addition.quantity} units of "${addition.product.name}"`,
          timestamp:
            addition.createdAt?.toISOString() || new Date().toISOString(),
          amount: addition.quantity,
          user: `${addition.createdBy.firstName} ${addition.createdBy.lastName}`,
          metadata: {
            productId: addition.productId,
            sku: addition.product.sku,
            supplier: addition.supplier?.name,
            cost: Number(addition.costPerUnit),
          },
        })),
        ...recentStockAdjustments.map((adjustment) => ({
          id: `stock-adjustment-${adjustment.id}`,
          type: "adjustment" as const,
          description: `${adjustment.adjustment_type === "INCREASE" ? "Increased" : "Decreased"} stock for "${adjustment.products?.name || "Unknown Product"}" by ${Math.abs(adjustment.quantity)} units`,
          timestamp:
            adjustment.created_at?.toISOString() || new Date().toISOString(),
          amount: adjustment.quantity,
          user: `${adjustment.users_stock_adjustments_user_idTousers.firstName} ${adjustment.users_stock_adjustments_user_idTousers.lastName}`,
          metadata: {
            productId: adjustment.product_id,
            sku: adjustment.products?.sku,
            reason: adjustment.reason,
            oldQuantity: adjustment.old_quantity,
            newQuantity: adjustment.new_quantity,
          },
        })),
        ...recentSales.map((sale) => ({
          id: `sale-${sale.id}`,
          type: "sale" as const,
          description: `Sale completed - Transaction #${sale.transaction_number}`,
          timestamp: sale.created_at?.toISOString() || new Date().toISOString(),
          amount: Number(sale.total_amount),
          user: `${sale.users.firstName} ${sale.users.lastName}`,
          metadata: {
            transactionNumber: sale.transaction_number,
            paymentMethod: sale.payment_method,
            paymentStatus: sale.payment_status,
            customerName: sale.customer_name,
          },
        })),
      ];

      // Sort by timestamp (most recent first) and take top 20
      const sortedActivities = activities
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )
        .slice(0, 20);

      return NextResponse.json({
        activities: sortedActivities,
      });
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      return NextResponse.json(
        { error: "Failed to fetch recent activity" },
        { status: 500 }
      );
    }
  }
);
