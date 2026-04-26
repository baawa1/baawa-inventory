function authModuleFactory() {
  return {
    auth: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    handlers: {
      GET: jest.fn(),
      POST: jest.fn(),
    },
  };
}

jest.mock('../../auth', authModuleFactory);
jest.mock('#root/auth', authModuleFactory);

jest.mock('@/lib/inventory-service', () => ({
  InventoryService: {
    deleteSalesTransaction: jest.fn(),
  },
}));

import { DELETE } from '@/app/api/sales/[id]/route';
import { auth } from '../../auth';
import { InventoryService } from '@/lib/inventory-service';

const authMock = auth as jest.MockedFunction<typeof auth>;
const mockDeleteSalesTransaction = InventoryService
  .deleteSalesTransaction as jest.Mock;

describe('DELETE /api/sales/[id]', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('deletes a sales transaction for admins', async () => {
    authMock.mockResolvedValue({
      user: {
        id: '7',
        role: 'ADMIN',
      },
    } as any);

    mockDeleteSalesTransaction.mockResolvedValue({
      id: 42,
      transactionNumber: 'TXN-42',
    });

    const response = await DELETE(
      {
        json: async () => ({ reason: 'Duplicate sale entry' }),
      } as any,
      {
        params: Promise.resolve({ id: '42' }),
      }
    );

    expect(response.status).toBe(200);
    expect(mockDeleteSalesTransaction).toHaveBeenCalledWith(
      42,
      7,
      'Duplicate sale entry'
    );

    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          id: 42,
          transactionNumber: 'TXN-42',
        }),
        message: 'Sales transaction deleted successfully',
      })
    );
  });

  it('returns 403 for non-admin users', async () => {
    authMock.mockResolvedValue({
      user: {
        id: '8',
        role: 'STAFF',
      },
    } as any);

    const response = await DELETE(
      {
        json: async () => ({ reason: 'Mistake' }),
      } as any,
      {
        params: Promise.resolve({ id: '42' }),
      }
    );

    expect(response.status).toBe(403);
    expect(mockDeleteSalesTransaction).not.toHaveBeenCalled();
  });

  it('returns 400 for invalid sales ids', async () => {
    authMock.mockResolvedValue({
      user: {
        id: '7',
        role: 'ADMIN',
      },
    } as any);

    const response = await DELETE(
      {
        json: async () => ({ reason: 'Mistake' }),
      } as any,
      {
        params: Promise.resolve({ id: 'not-a-number' }),
      }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: 'Invalid sales transaction ID',
      })
    );
  });

  it('returns 400 when the delete reason is missing', async () => {
    authMock.mockResolvedValue({
      user: {
        id: '7',
        role: 'ADMIN',
      },
    } as any);

    const response = await DELETE(
      {
        json: async () => ({}),
      } as any,
      {
        params: Promise.resolve({ id: '42' }),
      }
    );

    expect(response.status).toBe(400);
    expect(mockDeleteSalesTransaction).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: 'Delete reason is required',
      })
    );
  });

  it('returns 404 when the sale no longer exists', async () => {
    authMock.mockResolvedValue({
      user: {
        id: '7',
        role: 'ADMIN',
      },
    } as any);

    mockDeleteSalesTransaction.mockRejectedValue(
      new Error('Sales transaction not found')
    );

    const response = await DELETE(
      {
        json: async () => ({ reason: 'Cleanup' }),
      } as any,
      {
        params: Promise.resolve({ id: '42' }),
      }
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual(
      expect.objectContaining({
        error: 'Sales transaction not found',
      })
    );
  });
});
