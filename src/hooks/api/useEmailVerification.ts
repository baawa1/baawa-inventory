import { useMutation } from '@tanstack/react-query';
import { logger } from '@/lib/logger';
import type {
  ResendVerificationEmailResponse,
  VerifyEmailResponse,
} from '@/lib/auth/email-flow';

interface EmailVerificationRequest {
  token: string;
}

interface ResendVerificationEmailRequest {
  email: string;
}

const verifyEmail = async (
  request: EmailVerificationRequest
): Promise<VerifyEmailResponse> => {
  const response = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
};

const resendVerificationEmail = async (
  request: ResendVerificationEmailRequest
): Promise<ResendVerificationEmailResponse> => {
  const response = await fetch('/api/auth/verify-email', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}`);
  }

  return data;
};

export const useEmailVerification = () => {
  return useMutation({
    mutationFn: verifyEmail,
    onError: (error: Error) => {
      logger.error('Error verifying email', {
        error: error.message,
      });
    },
    onSuccess: data => {
      logger.info('Email verification completed', {
        email: data.email,
        redirectTo: data.redirectTo,
        shouldRefreshSession: data.shouldRefreshSession,
      });
    },
  });
};

export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: resendVerificationEmail,
    onError: (error: Error) => {
      logger.error('Error resending verification email', {
        error: error.message,
      });
    },
    onSuccess: data => {
      logger.info('Verification email resent', {
        email: data.email,
      });
    },
  });
};
