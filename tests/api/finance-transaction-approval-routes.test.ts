jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
      headers: new Map(),
    }),
  },
}));

import { POST as approveTransaction } from '@/app/api/finance/transactions/[id]/approve/route';
import { POST as rejectTransaction } from '@/app/api/finance/transactions/[id]/reject/route';

describe('retired finance transaction approval routes', () => {
  it('returns 410 for approval requests', async () => {
    const response = await approveTransaction();

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Manual finance approval workflow has been removed',
    });
  });

  it('returns 410 for rejection requests', async () => {
    const response = await rejectTransaction();

    expect(response.status).toBe(410);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      error: 'Manual finance approval workflow has been removed',
    });
  });
});
