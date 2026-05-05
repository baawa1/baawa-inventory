import { createApiResponse } from '@/lib/api-response';
// POST /api/finance/transactions/[id]/approve - retired
export async function POST() {
  return createApiResponse.error(
    'Manual finance approval workflow has been removed',
    410
  );
}
