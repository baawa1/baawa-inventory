import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { withPOSAuth, AuthenticatedRequest } from '@/lib/api-auth-middleware';
import { PRODUCT_STATUS, ERROR_MESSAGES } from '@/lib/constants';

// Validation schema for barcode lookup
const barcodeSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
});

async function handleBarcodeSearch(request: AuthenticatedRequest) {
  return NextResponse.json(
    { error: 'Barcode lookup functionality has been removed' },
    { status: 404 }
  );
}

export const GET = withPOSAuth(handleBarcodeSearch);
