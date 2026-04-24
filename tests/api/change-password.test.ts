jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
      headers: new Map(),
    }),
  },
}));

jest.mock('@/lib/api-middleware', () => ({
  withAuth: (handler: any) => handler,
}));

const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: any[]) => mockFindUnique(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
}));

const mockCompare = jest.fn();
const mockHash = jest.fn();
jest.mock('bcryptjs', () => ({
  compare: (...args: any[]) => mockCompare(...args),
  hash: (...args: any[]) => mockHash(...args),
}));

const mockHandleApiError = jest.fn((error: any) => {
  if (error?.name === 'ZodError') {
    return {
      status: 400,
      json: async () => ({
        error: 'Validation failed',
        code: 'VALIDATION_ERROR',
      }),
    };
  }

  return {
    status: 500,
    json: async () => ({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
    }),
  };
});

jest.mock('@/lib/api-error-handler-new', () => ({
  handleApiError: (...args: any[]) => mockHandleApiError(...args),
}));

import { PUT } from '@/app/api/users/change-password/route';

const validPassword = 'Abcd123.';

describe('PUT /api/users/change-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: unknown, userId: string = '1') =>
    ({
      user: { id: userId },
      json: async () => body,
    }) as any;

  it('returns 400 for invalid new password input', async () => {
    const response = await PUT(
      createRequest({
        currentPassword: 'old-password',
        newPassword: 'weak',
        confirmPassword: 'weak',
      })
    );

    expect(response.status).toBe(400);
    expect(mockHandleApiError).toHaveBeenCalled();
    const payload = await response.json();
    expect(payload.error).toBe('Validation failed');
  });

  it('returns 404 when the user is missing', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const response = await PUT(
      createRequest({
        currentPassword: 'old-password',
        newPassword: validPassword,
        confirmPassword: validPassword,
      })
    );

    expect(response.status).toBe(404);
    const payload = await response.json();
    expect(payload.error).toBe('User not found');
  });

  it('returns 400 when the current password is incorrect', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 1,
      password: 'hashed-old-password',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
    mockCompare.mockResolvedValueOnce(false);

    const response = await PUT(
      createRequest({
        currentPassword: 'wrong-password',
        newPassword: validPassword,
        confirmPassword: validPassword,
      })
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe('Current password is incorrect');
  });

  it('returns 400 when the account has no password set', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 1,
      password: null,
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
    });

    const response = await PUT(
      createRequest({
        currentPassword: 'old-password',
        newPassword: validPassword,
        confirmPassword: validPassword,
      })
    );

    expect(mockCompare).not.toHaveBeenCalled();
    expect(mockHash).not.toHaveBeenCalled();
    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe('No password set for this account');
  });

  it('changes the password successfully', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 1,
      password: 'hashed-old-password',
      email: 'user@example.com',
      firstName: 'Test',
      lastName: 'User',
    });
    mockCompare.mockResolvedValueOnce(true);
    mockHash.mockResolvedValueOnce('hashed-new-password');
    mockUpdate.mockResolvedValueOnce({});

    const response = await PUT(
      createRequest({
        currentPassword: 'old-password',
        newPassword: validPassword,
        confirmPassword: validPassword,
      })
    );

    expect(mockCompare).toHaveBeenCalledWith(
      'old-password',
      'hashed-old-password'
    );
    expect(mockHash).toHaveBeenCalledWith(validPassword, 12);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        password: 'hashed-new-password',
        sessionNeedsRefresh: true,
        sessionRefreshAt: expect.any(Date),
      },
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.message).toBe('Password changed successfully');
  });
});
