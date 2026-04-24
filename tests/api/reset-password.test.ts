import { POST } from '@/app/api/auth/reset-password/route';

// Mock dependencies
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();
const mockHash = jest.fn();
const mockSendPasswordResetEmail = jest.fn();
const mockSendPasswordResetConfirmationEmail = jest.fn();
const mockLogAuthEvent = jest.fn();
const mockLogPasswordResetSuccess = jest.fn();
const validPassword = 'Abcd123.';

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findFirst: (...args: any[]) => mockFindFirst(...args),
      update: (...args: any[]) => mockUpdate(...args),
    },
  },
}));

jest.mock('@/lib/email/service', () => ({
  emailService: {
    sendPasswordResetEmail: (...args: any[]) =>
      mockSendPasswordResetEmail(...args),
    sendPasswordResetConfirmationEmail: (...args: any[]) =>
      mockSendPasswordResetConfirmationEmail(...args),
  },
}));

jest.mock('@/lib/utils/audit-logger', () => ({
  AuditLogger: {
    logAuthEvent: (...args: any[]) => mockLogAuthEvent(...args),
    logPasswordResetSuccess: (...args: any[]) =>
      mockLogPasswordResetSuccess(...args),
  },
}));

jest.mock('@/lib/rate-limiting', () => ({
  withRateLimit: jest.fn(() => handler => handler),
}));

jest.mock('bcryptjs', () => ({
  hash: (...args: any[]) => mockHash(...args),
}));

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const createRequest = (body: any) => {
    return {
      json: async () => body,
      headers: new Headers({
        'Content-Type': 'application/json',
        'User-Agent': 'jest',
      }),
    };
  };

  describe('Input Validation', () => {
    it('returns 400 for missing token', async () => {
      const request = createRequest({
        password: validPassword,
        confirmPassword: validPassword,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input data');
      expect(data.details).toContainEqual(
        expect.objectContaining({
          path: ['token'],
        })
      );
    });

    it('returns 400 for missing password', async () => {
      const request = createRequest({
        token: 'valid-token',
        confirmPassword: validPassword,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input data');
    });

    it('returns 400 for invalid password format', async () => {
      const request = createRequest({
        token: 'valid-token',
        password: 'weak',
        confirmPassword: 'weak',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input data');
    });

    it('returns 400 for password mismatch', async () => {
      const request = createRequest({
        token: 'valid-token',
        password: validPassword,
        confirmPassword: 'DifferentPass123!',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid input data');
      expect(data.details).toContainEqual(
        expect.objectContaining({
          message: "Passwords don't match",
        })
      );
    });
  });

  describe('Token Validation', () => {
    it('returns 400 for invalid token', async () => {
      mockFindFirst.mockResolvedValue(null);

      const request = createRequest({
        token: 'invalid-token',
        password: validPassword,
        confirmPassword: validPassword,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid or expired reset token');
      expect(mockFindFirst).toHaveBeenCalledWith({
        where: {
          resetToken: 'invalid-token',
          resetTokenExpires: {
            gt: expect.any(Date),
          },
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          userStatus: true,
          emailVerified: true,
        },
      });
    });

    it('returns 403 for unverified user', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userStatus: 'PENDING',
        emailVerified: false,
      });

      const request = createRequest({
        token: 'valid-token',
        password: validPassword,
        confirmPassword: validPassword,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Account is not eligible for password reset');
    });

    it('returns 403 for non-approved user', async () => {
      mockFindFirst.mockResolvedValue({
        id: 'user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userStatus: 'SUSPENDED',
        emailVerified: true,
      });

      const request = createRequest({
        token: 'valid-token',
        password: validPassword,
        confirmPassword: validPassword,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Account is not eligible for password reset');
    });
  });

  describe('Password Reset Success', () => {
    it('successfully resets password with valid token', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userStatus: 'APPROVED',
        emailVerified: true,
      };

      mockFindFirst.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue(mockUser);
      mockHash.mockResolvedValue('hashed-password');
      mockSendPasswordResetConfirmationEmail.mockResolvedValue(undefined);
      mockLogPasswordResetSuccess.mockResolvedValue(undefined);

      const request = createRequest({
        token: 'valid-token',
        password: validPassword,
        confirmPassword: validPassword,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe(
        'Password reset successful! You can now login with your new password.'
      );
      expect(data.success).toBe(true);

      // Verify password was hashed
      expect(mockHash).toHaveBeenCalledWith(validPassword, 12);

      // Verify user was updated
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          password: 'hashed-password',
          resetToken: null,
          resetTokenExpires: null,
          lastActivity: expect.any(Date),
        },
      });

      // Verify audit log was created
      expect(mockLogPasswordResetSuccess).toHaveBeenCalledWith(
        'user-id',
        'test@example.com',
        request
      );

      // Verify email was sent
      expect(mockSendPasswordResetConfirmationEmail).toHaveBeenCalledWith(
        'test@example.com',
        {
          firstName: 'Test',
        }
      );
    });
  });

  describe('Error Handling', () => {
    it('returns 500 for database errors', async () => {
      mockFindFirst.mockRejectedValue(new Error('Database connection failed'));

      const request = createRequest({
        token: 'valid-token',
        password: validPassword,
        confirmPassword: validPassword,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to reset password. Please try again.');
    });

    it('returns 500 for password hashing errors', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userStatus: 'APPROVED',
        emailVerified: true,
      };

      mockFindFirst.mockResolvedValue(mockUser);
      mockHash.mockRejectedValue(new Error('Hashing failed'));

      const request = createRequest({
        token: 'valid-token',
        password: validPassword,
        confirmPassword: validPassword,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to reset password. Please try again.');
    });

    it('returns 500 for user update errors', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userStatus: 'APPROVED',
        emailVerified: true,
      };

      mockFindFirst.mockResolvedValue(mockUser);
      mockHash.mockResolvedValue('hashed-password');
      mockUpdate.mockRejectedValue(new Error('Update failed'));

      const request = createRequest({
        token: 'valid-token',
        password: validPassword,
        confirmPassword: validPassword,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to reset password. Please try again.');
    });
  });

  describe('Security', () => {
    it('clears reset token after successful password reset', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userStatus: 'APPROVED',
        emailVerified: true,
      };

      mockFindFirst.mockResolvedValue(mockUser);
      mockUpdate.mockResolvedValue(mockUser);
      mockHash.mockResolvedValue('hashed-password');
      mockSendPasswordResetConfirmationEmail.mockResolvedValue(undefined);
      mockLogPasswordResetSuccess.mockResolvedValue(undefined);

      const request = createRequest({
        token: 'valid-token',
        password: validPassword,
        confirmPassword: validPassword,
      });

      await POST(request);

      // Verify reset token is cleared
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'user-id' },
        data: {
          password: 'hashed-password',
          resetToken: null,
          resetTokenExpires: null,
          lastActivity: expect.any(Date),
        },
      });
    });

    it('logs failed attempts', async () => {
      mockFindFirst.mockResolvedValue(null);
      mockLogAuthEvent.mockResolvedValue(undefined);

      const request = createRequest({
        token: 'invalid-token',
        password: validPassword,
        confirmPassword: validPassword,
      });

      await POST(request);

      // Verify audit log was created for failed attempt
      expect(mockLogAuthEvent).toHaveBeenCalledWith(
        {
          action: 'PASSWORD_RESET_SUCCESS',
          success: false,
          errorMessage: 'Invalid or expired reset token',
          details: { token: 'invalid-...' },
        },
        request
      );
    });

    it('rejects reuse of a reset token after a successful reset', async () => {
      const mockUser = {
        id: 'user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        userStatus: 'APPROVED',
        emailVerified: true,
      };

      mockFindFirst
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(null);
      mockUpdate.mockResolvedValueOnce(mockUser);
      mockHash.mockResolvedValueOnce('hashed-password');
      mockSendPasswordResetConfirmationEmail.mockResolvedValue(undefined);
      mockLogPasswordResetSuccess.mockResolvedValue(undefined);
      mockLogAuthEvent.mockResolvedValue(undefined);

      const firstResponse = await POST(
        createRequest({
          token: 'one-time-token',
          password: validPassword,
          confirmPassword: validPassword,
        })
      );

      expect(firstResponse.status).toBe(200);

      const secondResponse = await POST(
        createRequest({
          token: 'one-time-token',
          password: validPassword,
          confirmPassword: validPassword,
        })
      );
      const secondPayload = await secondResponse.json();

      expect(secondResponse.status).toBe(400);
      expect(secondPayload.error).toBe('Invalid or expired reset token');
    });
  });
});
