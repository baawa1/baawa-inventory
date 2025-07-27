import { Session } from 'next-auth';

export const mockSession: Session = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'STAFF',
    status: 'APPROVED',
    userStatus: 'APPROVED',
    isEmailVerified: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
} as Session;

export const mockAdminSession: Session = {
  user: {
    id: 'test-admin-id',
    email: 'admin@example.com',
    name: 'Admin User',
    firstName: 'Admin',
    lastName: 'User',
    role: 'ADMIN',
    status: 'APPROVED',
    userStatus: 'APPROVED',
    isEmailVerified: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
} as Session;

export const mockManagerSession: Session = {
  user: {
    id: 'test-manager-id',
    email: 'manager@example.com',
    name: 'Manager User',
    firstName: 'Manager',
    lastName: 'User',
    role: 'MANAGER',
    status: 'APPROVED',
    userStatus: 'APPROVED',
    isEmailVerified: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
} as Session;
