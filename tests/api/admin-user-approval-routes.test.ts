jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) => ({
      status: init?.status ?? 200,
      json: async () => data,
      headers: new Map(),
    }),
  },
}));

jest.mock('@/lib/api-middleware', () => ({
  withPermission: jest.fn(
    (_roles: string[], handler: (...args: unknown[]) => unknown) => handler
  ),
}));

const mockFindUnique = jest.fn();
const mockUpdate = jest.fn();
jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

const mockSendUserApprovalEmail = jest.fn();
const mockSendUserRejectionEmail = jest.fn();
jest.mock('@/lib/email', () => ({
  emailService: {
    sendUserApprovalEmail: (...args: unknown[]) =>
      mockSendUserApprovalEmail(...args),
    sendUserRejectionEmail: (...args: unknown[]) =>
      mockSendUserRejectionEmail(...args),
  },
}));

jest.mock('@/lib/utils', () => ({
  getAppBaseUrl: () => 'http://localhost:3000',
}));

const mockLogUserStatusChange = jest.fn();
jest.mock('@/lib/utils/audit-logger', () => ({
  AuditLogger: {
    logUserStatusChange: (...args: unknown[]) => mockLogUserStatusChange(...args),
  },
}));

const mockResolveActingUserId = jest.fn();
jest.mock('@/lib/utils/resolve-acting-user-id', () => ({
  resolveActingUserId: (...args: unknown[]) => mockResolveActingUserId(...args),
}));

import { POST as approveUser } from '@/app/api/admin/approve-user/route';
import { POST as rejectUser } from '@/app/api/admin/reject-user/route';

describe('admin user approval routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.SUPPORT_EMAIL;
    delete process.env.FROM_EMAIL;
    mockResolveActingUserId.mockResolvedValue(7);
  });

  const createRequest = (body: unknown) =>
    ({
      json: async () => body,
      user: {
        id: '7',
        name: 'Admin User',
        email: 'admin@example.com',
      },
    }) as {
      json: () => Promise<unknown>;
      user: {
        id: string;
        name: string;
        email: string;
      };
    };

  it('stores approval metadata and refresh markers when approving a user', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 42,
      email: 'pending@example.com',
      userStatus: 'VERIFIED',
    });
    mockUpdate.mockResolvedValueOnce({
      id: 42,
      firstName: 'Pending',
      email: 'pending@example.com',
      role: 'STAFF',
      userStatus: 'APPROVED',
      approvedBy: 7,
      approvedAt: new Date('2026-04-24T08:00:00.000Z'),
    });

    const response = await approveUser(createRequest({ userId: 42 }));

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 42 },
      data: {
        userStatus: 'APPROVED',
        isActive: true,
        approvedBy: 7,
        approvedAt: expect.any(Date),
        rejectionReason: null,
        sessionNeedsRefresh: true,
        sessionRefreshAt: expect.any(Date),
      },
      select: {
        id: true,
        firstName: true,
        email: true,
        role: true,
        userStatus: true,
        approvedBy: true,
        approvedAt: true,
      },
    });
    expect(mockSendUserApprovalEmail).toHaveBeenCalledWith(
      'pending@example.com',
      {
        firstName: 'Pending',
        adminName: 'Admin User',
        dashboardLink: 'http://localhost:3000/dashboard',
        role: 'STAFF',
      }
    );
    expect(mockLogUserStatusChange).toHaveBeenCalledWith(
      7,
      42,
      'pending@example.com',
      'APPROVED',
      undefined,
      expect.anything()
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      success: true,
      message: 'User approved successfully',
      sessionUpdated: true,
      user: {
        id: 42,
        email: 'pending@example.com',
        userStatus: 'APPROVED',
        approvedBy: 7,
      },
    });
  });

  it('stores rejection metadata and refresh markers when rejecting a user', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 24,
      email: 'verified@example.com',
      userStatus: 'VERIFIED',
    });
    mockUpdate.mockResolvedValueOnce({
      id: 24,
      firstName: 'Verified',
      email: 'verified@example.com',
      userStatus: 'REJECTED',
      approvedBy: 7,
      approvedAt: new Date('2026-04-24T08:30:00.000Z'),
      rejectionReason: 'Missing details',
    });

    const response = await rejectUser(
      createRequest({ userId: 24, reason: 'Missing details' })
    );

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: 24 },
      data: {
        userStatus: 'REJECTED',
        isActive: false,
        approvedBy: 7,
        approvedAt: expect.any(Date),
        rejectionReason: 'Missing details',
        sessionNeedsRefresh: true,
        sessionRefreshAt: expect.any(Date),
      },
      select: {
        id: true,
        firstName: true,
        email: true,
        userStatus: true,
        approvedBy: true,
        approvedAt: true,
        rejectionReason: true,
      },
    });
    expect(mockSendUserRejectionEmail).toHaveBeenCalledWith(
      'verified@example.com',
      {
        firstName: 'Verified',
        adminName: 'Admin User',
        rejectionReason: 'Missing details',
        supportEmail: 'support@baawa.com',
      }
    );
    expect(mockLogUserStatusChange).toHaveBeenCalledWith(
      7,
      24,
      'verified@example.com',
      'REJECTED',
      'Missing details',
      expect.anything()
    );

    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload).toMatchObject({
      success: true,
      message: 'User rejected successfully',
      sessionUpdated: true,
      user: {
        id: 24,
        email: 'verified@example.com',
        userStatus: 'REJECTED',
        approvedBy: 7,
        rejectionReason: 'Missing details',
      },
    });
  });
});
