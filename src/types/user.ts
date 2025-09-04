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

// Session user type (for NextAuth session) - compatible with NextAuth's User type
export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus | string;
  isEmailVerified?: boolean;
  image?: string | null; // Allow null to match NextAuth default
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar_url?: string;
  createdAt?: string | Date;
  lastLogin?: string | Date;
  userStatus?: UserStatus | string; // Add for compatibility
  isActive?: boolean; // Add for compatibility
}

// (Interfaces are already exported above)
