import { useMutation } from '@tanstack/react-query';
import { logger } from '@/lib/logger';

interface TokenValidationRequest {
  token: string;
}

interface TokenValidationResponse {
  valid: boolean;
  message?: string;
  error?: string;
}

const validateToken = async (request: TokenValidationRequest): Promise<TokenValidationResponse> => {
  const response = await fetch('/api/auth/validate-reset-token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Failed to validate token' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};

export const useTokenValidation = () => {
  return useMutation({
    mutationFn: validateToken,
    onError: (error: Error) => {
      logger.error('Error validating token', {
        error: error.message,
      });
    },
    onSuccess: (data) => {
      logger.info('Token validation completed', {
        valid: data.valid,
      });
    },
  });
};
