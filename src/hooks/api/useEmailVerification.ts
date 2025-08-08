import { useMutation } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

interface EmailVerificationRequest {
  token: string;
}

interface EmailVerificationResponse {
  success: boolean;
  message: string;
  shouldRefreshSession?: boolean;
  error?: string;
}

const verifyEmail = async (
  request: EmailVerificationRequest
): Promise<EmailVerificationResponse> => {
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
        success: data.success,
        shouldRefreshSession: data.shouldRefreshSession,
      });
    },
  });
};
