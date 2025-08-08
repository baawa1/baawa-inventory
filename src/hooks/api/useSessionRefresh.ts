import { useMutation } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

interface SessionRefreshResponse {
  user: {
    id: string;
    role: string;
    status: string;
    isEmailVerified: boolean;
  };
  success: boolean;
  message: string;
}

// Removed unused interface

const refreshSession = async (): Promise<SessionRefreshResponse> => {
  const response = await fetch('/api/auth/refresh-session', {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Failed to refresh session' }));
    throw new Error(errorData.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export const useSessionRefresh = () => {
  return useMutation({
    mutationFn: refreshSession,
    onError: (error: Error) => {
      logger.error('Error refreshing session', {
        error: error.message,
      });
    },
    onSuccess: (data) => {
      logger.session('Session refreshed successfully', {
        userId: data.user?.id,
        role: data.user?.role,
        status: data.user?.status,
      });
    },
  });
};
