import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all stock additions for export
    const stockAdditions = await prisma.stockAddition.findMany({
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
            category: {
              select: {
                name: true,
              },
            },
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert to CSV format
    const csvHeaders = [
      "Date",
      "Product Name",
      "SKU",
      "Category",
      "Previous Stock",
      "Quantity Added",
      "New Stock",
      "Cost Per Unit (₦)",
      "Total Cost (₦)",
      "Supplier",
      "Reference Number",
      "Added By",
      "Notes",
    ];

    const csvRows = stockAdditions.map((addition) => {
      const previousStock = Math.max(
        0,
        addition.product.stock - addition.quantity
      );
      const newStock = addition.product.stock;
      const createdBy =
        `${addition.createdBy.firstName} ${addition.createdBy.lastName}`.trim();

      return [
        format(addition.createdAt || new Date(), "yyyy-MM-dd HH:mm:ss"),
        `"${addition.product.name.replace(/"/g, '""')}"`,
        addition.product.sku,
        addition.product.category?.name || "Uncategorized",
        previousStock.toString(),
        addition.quantity.toString(),
        newStock.toString(),
        addition.costPerUnit.toString(),
        addition.totalCost.toString(),
        addition.supplier
          ? `"${addition.supplier.name.replace(/"/g, '""')}"`
          : "",
        addition.referenceNo || "",
        `"${createdBy.replace(/"/g, '""')}"`,
        addition.notes ? `"${addition.notes.replace(/"/g, '""')}"` : "",
      ];
    });

    const csvContent = [csvHeaders, ...csvRows]
      .map((row) => row.join(","))
      .join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="stock-history-${format(new Date(), "yyyy-MM-dd")}.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting stock history:", error);
    return NextResponse.json(
      { error: "Failed to export stock history" },
      { status: 500 }
    );
  }
}
