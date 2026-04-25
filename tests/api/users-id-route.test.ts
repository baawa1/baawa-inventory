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
  withPermission: jest.fn((_roles: string[], handler: any) => handler),
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

const mockHash = jest.fn();
jest.mock('bcryptjs', () => ({
  hash: (...args: any[]) => mockHash(...args),
}));

const mockSendRoleChangeEmail = jest.fn();
jest.mock('@/lib/email', () => ({
  emailService: {
    sendRoleChangeEmail: (...args: any[]) => mockSendRoleChangeEmail(...args),
  },
}));

jest.mock('@/lib/utils', () => ({
  getAppBaseUrl: () => 'http://localhost:3000',
}));

const mockResolveActingUserId = jest.fn();
jest.mock('@/lib/utils/resolve-acting-user-id', () => ({
  resolveActingUserId: (...args: unknown[]) => mockResolveActingUserId(...args),
}));

import { PUT } from '@/app/api/users/[id]/route';

const validPassword = 'Abcd123.';

describe('PUT /api/users/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockResolveActingUserId.mockResolvedValue(999);
  });

  const createRequest = (body: unknown) =>
    ({
      json: async () => body,
      user: {
        id: '999',
        name: 'Admin User',
      },
    }) as any;

  const createParams = (id: string = '42') => ({
    params: Promise.resolve({ id }),
  });

  it('returns 400 for an invalid replacement password', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 42,
      email: 'user@example.com',
      role: 'STAFF',
      firstName: 'Jane',
      lastName: 'Doe',
      userStatus: 'APPROVED',
    });

    const response = await PUT(
      createRequest({
        firstName: 'Jane',
        password: 'weak',
      }),
      createParams()
    );

    expect(response.status).toBe(400);
    const payload = await response.json();
    expect(payload.error).toBe('Password must be at least 8 characters');
    expect(mockHash).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('hashes and stores a valid replacement password', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 42,
      email: 'user@example.com',
      role: 'STAFF',
      firstName: 'Jane',
      lastName: 'Doe',
      userStatus: 'APPROVED',
    });
    mockHash.mockResolvedValueOnce('hashed-password');
    mockUpdate.mockResolvedValueOnce({
      id: 42,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'user@example.com',
      role: 'STAFF',
      isActive: true,
      userStatus: 'APPROVED',
      createdAt: new Date(),
      lastLogin: null,
    });

    const response = await PUT(
      createRequest({
        firstName: 'Jane',
        password: validPassword,
      }),
      createParams()
    );

    expect(mockHash).toHaveBeenCalledWith(validPassword, 12);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 42 },
      data: {
        firstName: 'Jane',
        password: 'hashed-password',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        userStatus: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.email).toBe('user@example.com');
  });

  it('ignores blank password updates', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 42,
      email: 'user@example.com',
      role: 'STAFF',
      firstName: 'Jane',
      lastName: 'Doe',
      userStatus: 'APPROVED',
    });
    mockUpdate.mockResolvedValueOnce({
      id: 42,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'user@example.com',
      role: 'STAFF',
      isActive: true,
      userStatus: 'APPROVED',
      createdAt: new Date(),
      lastLogin: null,
    });

    const response = await PUT(
      createRequest({
        firstName: 'Jane',
        password: '   ',
      }),
      createParams()
    );

    expect(mockHash).not.toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 42 },
      data: {
        firstName: 'Jane',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        userStatus: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    expect(response.status).toBe(200);
  });

  it('persists user status updates and approval metadata', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 42,
      email: 'user@example.com',
      role: 'STAFF',
      firstName: 'Jane',
      lastName: 'Doe',
      userStatus: 'VERIFIED',
    });
    mockUpdate.mockResolvedValueOnce({
      id: 42,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'user@example.com',
      role: 'MANAGER',
      isActive: true,
      userStatus: 'APPROVED',
      createdAt: new Date(),
      lastLogin: null,
    });

    const response = await PUT(
      createRequest({
        firstName: 'Jane',
        role: 'MANAGER',
        userStatus: 'APPROVED',
      }),
      createParams()
    );

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 42 },
      data: {
        firstName: 'Jane',
        role: 'MANAGER',
        userStatus: 'APPROVED',
        approvedBy: 999,
        approvedAt: expect.any(Date),
        rejectionReason: null,
        isActive: true,
        sessionNeedsRefresh: true,
        sessionRefreshAt: expect.any(Date),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        userStatus: true,
        createdAt: true,
        lastLogin: true,
      },
    });

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      role: 'MANAGER',
      isActive: true,
      userStatus: 'APPROVED',
      sessionUpdated: true,
    });
  });
});
