import {
  USER_ROLES,
  canReadFinance,
  canWriteFinance,
  canApproveFinance,
  canDeleteFinance,
  authorizeUserForRoute,
} from '@/lib/auth/roles';

describe('finance permissions by role', () => {
  it('allows admin and manager to read/write finance', () => {
    expect(canReadFinance(USER_ROLES.ADMIN)).toBe(true);
    expect(canReadFinance(USER_ROLES.MANAGER)).toBe(true);
    expect(canReadFinance(USER_ROLES.STAFF)).toBe(false);
    expect(canReadFinance(null)).toBe(false);

    expect(canWriteFinance(USER_ROLES.ADMIN)).toBe(true);
    expect(canWriteFinance(USER_ROLES.MANAGER)).toBe(true);
    expect(canWriteFinance(USER_ROLES.STAFF)).toBe(false);
    expect(canWriteFinance(undefined)).toBe(false);
  });

  it('restricts finance approval/delete to admin only', () => {
    expect(canApproveFinance(USER_ROLES.ADMIN)).toBe(true);
    expect(canApproveFinance(USER_ROLES.MANAGER)).toBe(false);
    expect(canApproveFinance(USER_ROLES.STAFF)).toBe(false);

    expect(canDeleteFinance(USER_ROLES.ADMIN)).toBe(true);
    expect(canDeleteFinance(USER_ROLES.MANAGER)).toBe(false);
    expect(canDeleteFinance(USER_ROLES.STAFF)).toBe(false);
  });
});

describe('route authorization', () => {
  it('denies access when role is missing', () => {
    expect(authorizeUserForRoute(null, '/dashboard')).toBe(false);
  });

  it('grants admin access to all routes', () => {
    expect(authorizeUserForRoute(USER_ROLES.ADMIN, '/admin')).toBe(true);
    expect(authorizeUserForRoute(USER_ROLES.ADMIN, '/reports')).toBe(true);
    expect(authorizeUserForRoute(USER_ROLES.ADMIN, '/pos')).toBe(true);
  });

  it('applies route-based access rules for manager and staff', () => {
    expect(authorizeUserForRoute(USER_ROLES.MANAGER, '/admin')).toBe(false);
    expect(authorizeUserForRoute(USER_ROLES.MANAGER, '/reports')).toBe(true);
    expect(authorizeUserForRoute(USER_ROLES.MANAGER, '/settings')).toBe(true);
    expect(authorizeUserForRoute(USER_ROLES.MANAGER, '/pos')).toBe(true);

    expect(authorizeUserForRoute(USER_ROLES.STAFF, '/admin')).toBe(false);
    expect(authorizeUserForRoute(USER_ROLES.STAFF, '/reports')).toBe(false);
    expect(authorizeUserForRoute(USER_ROLES.STAFF, '/pos')).toBe(true);
    expect(authorizeUserForRoute(USER_ROLES.STAFF, '/dashboard')).toBe(true);
  });
});
