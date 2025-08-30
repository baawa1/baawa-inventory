import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { handleApiError } from '@/lib/api-error-handler-new';
import { envConfig } from '@/lib/config/env-validation';

// Require authentication even in development
export const GET = withAuth(async (req: AuthenticatedRequest) => {
  // Only allow test data endpoints in development
  if (!envConfig.isDevelopment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    // Test categories
    const categoriesData = await prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    // Test brands
    const brandsData = await prisma.brand.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      categories: { data: categoriesData || [] },
      brands: { data: brandsData || [] },
      message: 'Test data fetched successfully (development only)',
    });
  } catch (error) {
    return handleApiError(error);
  }
});