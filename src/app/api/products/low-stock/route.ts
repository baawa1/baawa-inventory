import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { prisma } from '@/lib/db';

// GET /api/products/low-stock - Get products with low stock
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search') || '';

    // Build where clause with low stock condition at database level
    let whereCondition = `
      WHERE p."isArchived" = false
      AND (p.stock = 0 OR p.stock <= p."minStock")
    `;

    // Add search condition if provided
    if (search) {
      const searchParam = `%${search}%`;
      whereCondition += `
        AND (
          p.name ILIKE $1
          OR p.sku ILIKE $1
          OR c.name ILIKE $1
          OR b.name ILIKE $1
        )
      `;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      LEFT JOIN "Brand" b ON p."brandId" = b.id
      ${whereCondition}
    `;

    const countResult = search
      ? await prisma.$queryRawUnsafe<[{ total: bigint }]>(
          countQuery,
          `%${search}%`
        )
      : await prisma.$queryRawUnsafe<[{ total: bigint }]>(countQuery);

    const total = Number(countResult[0]?.total || 0);

    // Get paginated products
    const productsQuery = `
      SELECT
        p.id,
        p.name,
        p.sku,
        p.stock,
        p."minStock",
        p.cost,
        p.price,
        p.status,
        p."createdAt",
        p."updatedAt",
        jsonb_build_object('id', c.id, 'name', c.name) as category,
        jsonb_build_object('id', b.id, 'name', b.name) as brand,
        jsonb_build_object('id', s.id, 'name', s.name) as supplier
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      LEFT JOIN "Brand" b ON p."brandId" = b.id
      LEFT JOIN "Supplier" s ON p."supplierId" = s.id
      ${whereCondition}
      ORDER BY p.stock ASC, p.name ASC
      LIMIT $${search ? 2 : 1} OFFSET $${search ? 3 : 2}
    `;

    const products = search
      ? await prisma.$queryRawUnsafe<any[]>(
          productsQuery,
          `%${search}%`,
          limit,
          offset
        )
      : await prisma.$queryRawUnsafe<any[]>(productsQuery, limit, offset);

    // Calculate metrics with raw SQL for better performance
    const metricsQuery = `
      SELECT
        SUM(p.stock * p.cost) as "totalValue",
        COUNT(CASE WHEN p.stock = 0 OR p.stock <= p."minStock" * 0.5 THEN 1 END) as "criticalStock",
        COUNT(CASE WHEN p.stock > 0 AND p.stock <= p."minStock" THEN 1 END) as "lowStock"
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      LEFT JOIN "Brand" b ON p."brandId" = b.id
      ${whereCondition}
    `;

    const metricsResult = search
      ? await prisma.$queryRawUnsafe<
          [{ totalValue: any; criticalStock: bigint; lowStock: bigint }]
        >(metricsQuery, `%${search}%`)
      : await prisma.$queryRawUnsafe<
          [{ totalValue: any; criticalStock: bigint; lowStock: bigint }]
        >(metricsQuery);

    const metrics = metricsResult[0] || {
      totalValue: 0,
      criticalStock: 0,
      lowStock: 0,
    };

    // Transform products to match expected format
    const transformedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      stock: product.stock,
      minStock: product.minStock,
      cost: Number(product.cost),
      price: Number(product.price),
      status: product.status,
      category: product.category,
      brand: product.brand,
      supplier: product.supplier,
      createdAt: product.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: product.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    return NextResponse.json({
      products: transformedProducts,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      metrics: {
        totalValue: Number(metrics.totalValue || 0),
        criticalStock: Number(metrics.criticalStock || 0),
        lowStock: Number(metrics.lowStock || 0),
        totalProducts: total,
      },
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch low stock products' },
      { status: 500 }
    );
  }
});
