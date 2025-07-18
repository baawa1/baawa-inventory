import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { prisma } from "@/lib/db";
import { format } from "date-fns";
import { hasPermission } from "@/lib/auth/roles";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role permissions
    if (!hasPermission(session.user.role, "REPORTS_READ")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "current_stock";
    const format_type = searchParams.get("format") || "json";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const supplier = searchParams.get("supplier");
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";
    const includeArchived = searchParams.get("includeArchived") === "true";

    let reportData;
    let reportTitle;
    let filename;

    switch (reportType) {
      case "current_stock":
        reportData = await getCurrentStockReport({
          category,
          brand,
          supplier,
          lowStockOnly,
          includeArchived,
          page,
          limit,
        });
        reportTitle = "Current Stock Report";
        filename = `current-stock-${format(new Date(), "yyyy-MM-dd")}`;
        break;

      case "stock_value":
        reportData = await getStockValueReport({
          category,
          brand,
          supplier,
          includeArchived,
          page,
          limit,
        });
        reportTitle = "Stock Value Report";
        filename = `stock-value-${format(new Date(), "yyyy-MM-dd")}`;
        break;

      case "low_stock":
        reportData = await getLowStockReport({
          category,
          brand,
          supplier,
          page,
          limit,
        });
        reportTitle = "Low Stock Report";
        filename = `low-stock-${format(new Date(), "yyyy-MM-dd")}`;
        break;

      case "product_summary":
        reportData = await getProductSummaryReport({
          category,
          brand,
          supplier,
          includeArchived,
          page,
          limit,
        });
        reportTitle = "Product Summary Report";
        filename = `product-summary-${format(new Date(), "yyyy-MM-dd")}`;
        break;

      default:
        return NextResponse.json(
          { error: "Invalid report type" },
          { status: 400 }
        );
    }

    // Return JSON format
    if (format_type === "json") {
      return NextResponse.json({
        title: reportTitle,
        generatedAt: new Date().toISOString(),
        data: reportData,
        pagination: reportData.pagination || {
          page: page,
          limit: limit,
          total: 0,
          totalPages: 1,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      });
    }

    // Return CSV format
    if (format_type === "csv") {
      const csvContent = generateCSV(reportData, reportType);
      return new NextResponse(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    return NextResponse.json({ error: "Invalid format type" }, { status: 400 });
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}

async function getCurrentStockReport(filters: {
  category?: string | null;
  brand?: string | null;
  supplier?: string | null;
  lowStockOnly?: boolean;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}) {
  const where: any = {};

  if (!filters.includeArchived) {
    where.isArchived = false;
  }

  if (filters.category) {
    where.categoryId = parseInt(filters.category);
  }

  if (filters.brand) {
    where.brandId = parseInt(filters.brand);
  }

  if (filters.supplier) {
    where.supplierId = parseInt(filters.supplier);
  }

  // Calculate pagination
  const skip = (filters.page || 1) - 1;
  const take = filters.limit || 10;

  // First get all products for filtering (if lowStockOnly is true)
  const allProducts = await prisma.product.findMany({
    where,
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
      supplier: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  // Filter low stock products after fetching if needed
  let filteredProducts = allProducts;
  if (filters.lowStockOnly) {
    filteredProducts = allProducts.filter(
      (product) => product.stock <= product.minStock
    );
  }

  // Apply pagination to filtered results
  const paginatedProducts = filteredProducts.slice(
    skip * take,
    (skip + 1) * take
  );

  return {
    products: paginatedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category?.name || "Uncategorized",
      brand: product.brand?.name || "No Brand",
      supplier: product.supplier?.name || "No Supplier",
      currentStock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      costPrice: Number(product.cost),
      sellingPrice: Number(product.price),
      stockValue: product.stock * Number(product.cost),
      isLowStock: product.stock <= product.minStock,
      isArchived: product.isArchived,
      lastUpdated: product.updatedAt,
    })),
    pagination: {
      page: filters.page || 1,
      limit: filters.limit || 10,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / (filters.limit || 10)),
    },
  };
}

async function getStockValueReport(filters: {
  category?: string | null;
  brand?: string | null;
  supplier?: string | null;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}) {
  const where: any = {};

  if (!filters.includeArchived) {
    where.isArchived = false;
  }

  if (filters.category) {
    where.categoryId = parseInt(filters.category);
  }

  if (filters.brand) {
    where.brandId = parseInt(filters.brand);
  }

  if (filters.supplier) {
    where.supplierId = parseInt(filters.supplier);
  }

  // Calculate pagination
  const skip = (filters.page || 1) - 1;
  const take = filters.limit || 10;

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        brand: { select: { name: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      skip: skip * take,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  const totalValue = products.reduce(
    (sum, product) => sum + product.stock * Number(product.cost),
    0
  );

  const totalSellingValue = products.reduce(
    (sum, product) => sum + product.stock * Number(product.price),
    0
  );

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / take);
  const hasNextPage = (filters.page || 1) < totalPages;
  const hasPreviousPage = (filters.page || 1) > 1;

  return {
    summary: {
      totalProducts: totalCount,
      totalStockValue: totalValue,
      totalSellingValue: totalSellingValue,
      potentialProfit: totalSellingValue - totalValue,
    },
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category?.name || "Uncategorized",
      brand: product.brand?.name || "No Brand",
      supplier: product.supplier?.name || "No Supplier",
      currentStock: product.stock,
      costPrice: Number(product.cost),
      sellingPrice: Number(product.price),
      stockValue: product.stock * Number(product.cost),
      sellingValue: product.stock * Number(product.price),
      potentialProfit:
        product.stock * (Number(product.price) - Number(product.cost)),
      profitMargin:
        Number(product.price) > 0
          ? ((Number(product.price) - Number(product.cost)) /
              Number(product.price)) *
            100
          : 0,
    })),
    pagination: {
      page: filters.page || 1,
      limit: filters.limit || 10,
      total: totalCount,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  };
}

async function getLowStockReport(filters: {
  category?: string | null;
  brand?: string | null;
  supplier?: string | null;
  page?: number;
  limit?: number;
}) {
  const where: any = {
    isArchived: false,
  };

  if (filters.category) {
    where.categoryId = parseInt(filters.category);
  }

  if (filters.brand) {
    where.brandId = parseInt(filters.brand);
  }

  if (filters.supplier) {
    where.supplierId = parseInt(filters.supplier);
  }

  // Calculate pagination
  const skip = (filters.page || 1) - 1;
  const take = filters.limit || 10;

  // First get all products to filter for low stock
  const allProducts = await prisma.product.findMany({
    where,
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
      supplier: { select: { name: true } },
    },
    orderBy: { stock: "asc" },
  });

  // Filter for low stock after fetching
  const lowStockProducts = allProducts.filter(
    (product) => product.stock <= product.minStock
  );

  // Apply pagination to filtered results
  const paginatedProducts = lowStockProducts.slice(
    skip * take,
    (skip + 1) * take
  );

  // Calculate pagination metadata
  const totalPages = Math.ceil(lowStockProducts.length / take);
  const hasNextPage = (filters.page || 1) < totalPages;
  const hasPreviousPage = (filters.page || 1) > 1;

  return {
    products: paginatedProducts.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category?.name || "Uncategorized",
      brand: product.brand?.name || "No Brand",
      supplier: product.supplier?.name || "No Supplier",
      currentStock: product.stock,
      minStock: product.minStock,
      maxStock: product.maxStock,
      reorderQuantity: Math.max(
        0,
        (product.maxStock || product.minStock * 2) - product.stock
      ),
      stockShortage: Math.max(0, product.minStock - product.stock),
      costPrice: Number(product.cost),
      reorderValue:
        Math.max(
          0,
          (product.maxStock || product.minStock * 2) - product.stock
        ) * Number(product.cost),
      daysOutOfStock: product.stock <= 0 ? "Out of Stock" : "Low Stock",
      lastUpdated: product.updatedAt,
    })),
    pagination: {
      page: filters.page || 1,
      limit: filters.limit || 10,
      total: lowStockProducts.length,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  };
}

async function getProductSummaryReport(filters: {
  category?: string | null;
  brand?: string | null;
  supplier?: string | null;
  includeArchived?: boolean;
  page?: number;
  limit?: number;
}) {
  const where: any = {};

  if (!filters.includeArchived) {
    where.isArchived = false;
  }

  if (filters.category) {
    where.categoryId = parseInt(filters.category);
  }

  if (filters.brand) {
    where.brandId = parseInt(filters.brand);
  }

  if (filters.supplier) {
    where.supplierId = parseInt(filters.supplier);
  }

  const [products, categoryStats, brandStats, supplierStats] =
    await Promise.all([
      prisma.product.count({ where }),
      prisma.product.groupBy({
        by: ["categoryId"],
        where,
        _count: { id: true },
        _sum: { stock: true },
      }),
      prisma.product.groupBy({
        by: ["brandId"],
        where,
        _count: { id: true },
        _sum: { stock: true },
      }),
      prisma.product.groupBy({
        by: ["supplierId"],
        where,
        _count: { id: true },
        _sum: { stock: true },
      }),
    ]);

  // Get category names
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });

  // Get brand names
  const brands = await prisma.brand.findMany({
    select: { id: true, name: true },
  });

  // Get supplier names
  const suppliers = await prisma.supplier.findMany({
    select: { id: true, name: true },
  });

  // Calculate pagination metadata
  const totalPages = Math.ceil(products / (filters.limit || 10));
  const hasNextPage = (filters.page || 1) < totalPages;
  const hasPreviousPage = (filters.page || 1) > 1;

  return {
    totalProducts: products,
    byCategory: categoryStats.map((stat) => ({
      category:
        categories.find((c) => c.id === stat.categoryId)?.name ||
        "Uncategorized",
      productCount: stat._count.id,
      totalStock: stat._sum.stock || 0,
    })),
    byBrand: brandStats.map((stat) => ({
      brand: brands.find((b) => b.id === stat.brandId)?.name || "No Brand",
      productCount: stat._count.id,
      totalStock: stat._sum.stock || 0,
    })),
    bySupplier: supplierStats.map((stat) => ({
      supplier:
        suppliers.find((s) => s.id === stat.supplierId)?.name || "No Supplier",
      productCount: stat._count.id,
      totalStock: stat._sum.stock || 0,
    })),
    pagination: {
      page: filters.page || 1,
      limit: filters.limit || 10,
      total: products,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    },
  };
}

function generateCSV(data: any, reportType: string): string {
  if (reportType === "current_stock") {
    const headers = [
      "Product Name",
      "SKU",
      "Category",
      "Brand",
      "Supplier",
      "Current Stock",
      "Min Stock",
      "Max Stock",
      "Cost Price (₦)",
      "Selling Price (₦)",
      "Stock Value (₦)",
      "Low Stock",
      "Archived",
      "Last Updated",
    ];

    const rows = data.map((item: any) => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.sku,
      item.category,
      item.brand,
      item.supplier,
      item.currentStock,
      item.minStock,
      item.maxStock,
      item.costPrice,
      item.sellingPrice,
      item.stockValue,
      item.isLowStock ? "Yes" : "No",
      item.isArchived ? "Yes" : "No",
      format(new Date(item.lastUpdated), "yyyy-MM-dd HH:mm:ss"),
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  if (reportType === "stock_value") {
    const headers = [
      "Product Name",
      "SKU",
      "Category",
      "Brand",
      "Supplier",
      "Current Stock",
      "Cost Price (₦)",
      "Selling Price (₦)",
      "Stock Value (₦)",
      "Selling Value (₦)",
      "Potential Profit (₦)",
      "Profit Margin (%)",
    ];

    const rows = data.products.map((item: any) => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.sku,
      item.category,
      item.brand,
      item.supplier,
      item.currentStock,
      item.costPrice,
      item.sellingPrice,
      item.stockValue,
      item.sellingValue,
      item.potentialProfit,
      item.profitMargin.toFixed(2),
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  if (reportType === "low_stock") {
    const headers = [
      "Product Name",
      "SKU",
      "Category",
      "Brand",
      "Supplier",
      "Current Stock",
      "Min Stock",
      "Max Stock",
      "Reorder Quantity",
      "Stock Shortage",
      "Cost Price (₦)",
      "Reorder Value (₦)",
      "Status",
      "Last Updated",
    ];

    const rows = data.map((item: any) => [
      `"${item.name.replace(/"/g, '""')}"`,
      item.sku,
      item.category,
      item.brand,
      item.supplier,
      item.currentStock,
      item.minStock,
      item.maxStock,
      item.reorderQuantity,
      item.stockShortage,
      item.costPrice,
      item.reorderValue,
      item.daysOutOfStock,
      format(new Date(item.lastUpdated), "yyyy-MM-dd HH:mm:ss"),
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }

  return "Invalid report type";
}
