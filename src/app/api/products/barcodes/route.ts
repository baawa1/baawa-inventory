import { NextResponse } from 'next/server';
import { withPermission } from '@/lib/api-middleware';
import { USER_ROLES } from '@/lib/auth/roles';

// POST /api/products/barcodes - Barcode functionality has been removed
export const POST = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async () => {
    return NextResponse.json(
      { error: 'Barcode functionality has been removed from this system' },
      { status: 404 }
    );
  }
);

// GET /api/products/barcodes - Barcode functionality has been removed
export const GET = withPermission(
  [USER_ROLES.ADMIN, USER_ROLES.MANAGER],
  async () => {
    return NextResponse.json(
      { error: 'Barcode functionality has been removed from this system' },
      { status: 404 }
    );
  }
);