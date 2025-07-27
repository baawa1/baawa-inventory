// Unified user and session types for backend and frontend

// User roles
export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

// User status - must match Prisma schema
export type UserStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

// Minimal user type for authentication/session
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus | string;
  isEmailVerified: boolean;
}

// Full user type for app logic (extends AuthUser)
export interface AppUser extends AuthUser {
  firstName: string;
  lastName: string;
  isActive: boolean;
  userStatus: UserStatus | string;
  createdAt: string | Date;
  updatedAt?: string | Date;
  lastLogin?: string | Date;
  approvedBy?: string | number;
  approvedAt?: string | Date;
  rejectionReason?: string;
}

// Session user type (for NextAuth session)
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus | string;
  isEmailVerified?: boolean;
  image?: string;
}

// (Interfaces are already exported above)
