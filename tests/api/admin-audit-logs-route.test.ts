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

const mockAuditLogFindMany = jest.fn();
const mockAuditLogCount = jest.fn();
const mockLoggerError = jest.fn();

jest.mock('@/lib/db', () => ({
  prisma: {
    auditLog: {
      findMany: (...args: unknown[]) => mockAuditLogFindMany(...args),
      count: (...args: unknown[]) => mockAuditLogCount(...args),
    },
  },
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    error: (...args: unknown[]) => mockLoggerError(...args),
  },
}));

import { GET } from '@/app/api/admin/audit-logs/route';

describe('GET /api/admin/audit-logs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns paginated audit logs and applies filters/search/sort', async () => {
    mockAuditLogFindMany.mockResolvedValue([
      {
        id: 1,
        action: 'LOGIN_SUCCESS',
        table_name: 'auth',
        record_id: 7,
        old_values: null,
        new_values: { success: true },
        ip_address: '203.0.113.10',
        user_agent: 'jest-agent',
        created_at: new Date('2026-04-25T09:00:00.000Z'),
        users: {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
        },
      },
    ]);
    mockAuditLogCount.mockResolvedValue(21);

    const response = await GET({
      url: 'http://localhost/api/admin/audit-logs?page=2&limit=10&userId=7&action=LOGIN&search=admin@example.com&from=2026-04-01&to=2026-04-25&sortBy=action&sortOrder=asc',
      user: {
        id: '1',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    } as any);

    expect(response.status).toBe(200);
    expect(mockAuditLogFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { action: 'asc' },
        skip: 10,
        take: 10,
      })
    );

    const findManyArgs = mockAuditLogFindMany.mock.calls[0][0];
    expect(findManyArgs.where.AND).toEqual(
      expect.arrayContaining([
        { user_id: 7 },
        {
          action: {
            contains: 'LOGIN',
            mode: 'insensitive',
          },
        },
        {
          created_at: {
            gte: expect.any(Date),
            lte: expect.any(Date),
          },
        },
        expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              action: {
                contains: 'admin@example.com',
                mode: 'insensitive',
              },
            }),
            expect.objectContaining({
              users: {
                is: {
                  OR: expect.arrayContaining([
                    {
                      email: {
                        contains: 'admin@example.com',
                        mode: 'insensitive',
                      },
                    },
                  ]),
                },
              },
            }),
          ]),
        }),
      ])
    );

    const payload = await response.json();
    expect(payload).toMatchObject({
      totalPages: 3,
      totalCount: 21,
      currentPage: 2,
    });
    expect(payload.logs).toHaveLength(1);
  });

  it('rejects an invalid userId filter', async () => {
    const response = await GET({
      url: 'http://localhost/api/admin/audit-logs?userId=not-a-number',
      user: {
        id: '1',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    } as any);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Invalid userId filter',
    });
    expect(mockAuditLogFindMany).not.toHaveBeenCalled();
  });

  it('rejects partially numeric userId values', async () => {
    const response = await GET({
      url: 'http://localhost/api/admin/audit-logs?userId=7abc',
      user: {
        id: '1',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    } as any);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Invalid userId filter',
    });
    expect(mockAuditLogFindMany).not.toHaveBeenCalled();
  });

  it('rejects invalid date ranges', async () => {
    const response = await GET({
      url: 'http://localhost/api/admin/audit-logs?from=2026-04-26&to=2026-04-25',
      user: {
        id: '1',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
    } as any);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: 'Invalid date range: from must be before or equal to to',
    });
    expect(mockAuditLogFindMany).not.toHaveBeenCalled();
  });
});
