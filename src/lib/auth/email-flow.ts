import type { UserRole, UserStatus } from '@/types/user';

export interface RegistrationUserSummary {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  role: UserRole;
}

export interface RegisterResponse {
  message: string;
  email: string;
  requiresVerification: true;
  redirectTo: '/check-email';
  verificationEmailSent: boolean;
  user?: RegistrationUserSummary;
}

export interface VerifyEmailResponse {
  message: string;
  email: string;
  user: {
    id: number;
    email: string;
    firstName: string;
    status: UserStatus;
    emailVerified: boolean;
  };
  shouldRefreshSession: boolean;
  requiresLogin: boolean;
  redirectTo: '/login';
}

export interface ResendVerificationEmailResponse {
  message: string;
  email: string;
  verificationEmailSent: true;
}

export function buildCheckEmailPath(
  email: string,
  verificationEmailSent = true
): string {
  const searchParams = new URLSearchParams({ email });

  if (!verificationEmailSent) {
    searchParams.set('sent', '0');
  }

  return `/check-email?${searchParams.toString()}`;
}
