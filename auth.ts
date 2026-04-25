import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './src/lib/db';
import * as bcrypt from 'bcryptjs';
import { AccountLockout } from './src/lib/utils/account-lockout';
import { AuditLogger } from './src/lib/utils/audit-logger';
import { getClientIp } from './src/lib/utils/request-ip';
import { authConfig } from './auth.config';

/**
 * Full auth configuration with database providers
 * This file is used for server-side auth (API routes, server components)
 * The middleware uses auth.config.ts directly for Edge compatibility
 */

/**
 * Check if database operations are safe to perform
 */
function isDatabaseSafe(): boolean {
  return typeof prisma?.user?.findUnique === 'function';
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) {
          await AuditLogger.logLoginFailed(
            email || 'unknown',
            'Missing credentials',
            req
          );
          return null;
        }

        try {
          // Check account lockout status
          const emailLockoutStatus = await AccountLockout.checkLockoutStatus(
            email,
            'email'
          );
          if (emailLockoutStatus.isLocked) {
            await AuditLogger.logAccountLocked(
              'email',
              email,
              emailLockoutStatus,
              req
            );
            return null;
          }

          // Check IP lockout status
          const ipAddress = getClientIp(req);
          const ipLockoutStatus = await AccountLockout.checkLockoutStatus(
            ipAddress,
            'ip'
          );
          if (ipLockoutStatus.isLocked) {
            await AuditLogger.logAccountLocked(
              'ip',
              ipAddress,
              ipLockoutStatus,
              req
            );
            return null;
          }

          // Find user and validate
          const user = await prisma.user.findFirst({
            where: {
              email: email.toLowerCase(),
              isActive: true,
            },
            select: {
              id: true,
              email: true,
              password: true,
              firstName: true,
              lastName: true,
              role: true,
              userStatus: true,
              emailVerified: true,
              emailVerifiedAt: true,
              isActive: true,
              createdAt: true,
              approvedAt: true,
              approvedBy: true,
              phone: true,
              lastLogin: true,
              avatar_url: true,
            },
          });

          if (!user) {
            await AuditLogger.logLoginFailed(email, 'User not found', req);
            return null;
          }

          // Validate password first
          if (!user.password) {
            await AuditLogger.logLoginFailed(email, 'No password set', req);
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            await AuditLogger.logLoginFailed(email, 'Invalid password', req);
            return null;
          }

          // Allow login for all active users regardless of status
          // The middleware will handle redirects based on status
          if (!user.isActive) {
            await AuditLogger.logLoginFailed(
              email,
              'User account is inactive',
              req
            );
            return null;
          }

          // Update last login and reset lockout counters
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLogin: new Date(),
              lastActivity: new Date(),
            },
          });

          await AccountLockout.resetFailedAttempts(email, ipAddress);
          await AuditLogger.logLoginSuccess(user.id, user.email, req);

          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            status: user.userStatus || 'PENDING',
            isEmailVerified: Boolean(user.emailVerified),
            firstName: user.firstName,
            lastName: user.lastName,
            isActive: user.isActive,
            userStatus: user.userStatus || 'PENDING',
            createdAt: user.createdAt || new Date(),
          };
        } catch (error) {
          console.error('Authentication error:', error);
          await AuditLogger.logLoginFailed(email, 'Authentication failed', req);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // Override JWT callback to include database refresh logic (server-side only)
    async jwt({ token, user, trigger }) {
      // First, run the base callback from config
      if (user) {
        token.role = user.role;
        token.status = user.status;
        token.isEmailVerified = Boolean(user.isEmailVerified);
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.isActive = Boolean(user.isActive);
        token.userStatus = user.userStatus;
        token.createdAt = user.createdAt;
        token.phone = user.phone;
        token.lastLogin = user.lastLogin;
        token.avatar_url = user.avatar_url;
        token.dataFetchedAt = Date.now();
      }

      // Only fetch fresh data if it's been more than 5 minutes since last fetch
      const shouldFetchFreshData =
        trigger === 'update' ||
        !token.dataFetchedAt ||
        Date.now() - (token.dataFetchedAt as number) >
          (process.env.NODE_ENV === 'development'
            ? 15 * 60 * 1000
            : 5 * 60 * 1000);

      // Only perform database operations if we're in a safe runtime environment
      if (
        token.sub &&
        shouldFetchFreshData &&
        typeof window === 'undefined' &&
        isDatabaseSafe()
      ) {
        try {
          const freshUser = await prisma.user.findUnique({
            where: { id: parseInt(token.sub) },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
              userStatus: true,
              emailVerified: true,
              isActive: true,
              createdAt: true,
              phone: true,
              lastLogin: true,
              avatar_url: true,
            },
          });

          if (freshUser) {
            token.role = freshUser.role;
            token.status = freshUser.userStatus || 'PENDING';
            token.isEmailVerified = Boolean(freshUser.emailVerified);
            token.firstName = freshUser.firstName;
            token.lastName = freshUser.lastName;
            token.isActive = freshUser.isActive;
            token.userStatus = freshUser.userStatus || 'PENDING';
            token.createdAt = freshUser.createdAt || new Date();
            token.phone = freshUser.phone || undefined;
            token.lastLogin = freshUser.lastLogin || undefined;
            token.avatar_url = freshUser.avatar_url || undefined;
            token.dataFetchedAt = Date.now();
          }
        } catch (_error) {
          // Error fetching fresh user data - silently continue with cached data
        }
      }

      return token;
    },
  },
  events: {
    async signOut(message) {
      if ('token' in message && message.token?.sub && isDatabaseSafe()) {
        const userId = parseInt(message.token.sub);
        const userEmail = message.token.email as string;

        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
          });

          if (user) {
            await prisma.user.update({
              where: { id: userId },
              data: { lastLogout: new Date() },
            });
            await AuditLogger.logLogout(userId, userEmail || 'unknown');
          }
        } catch (_error) {
          // Silently fail
        }
      }
    },
    async session(message) {
      if ('token' in message && message.token?.sub && isDatabaseSafe()) {
        const userId = parseInt(message.token.sub);

        try {
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
          });

          if (user) {
            await prisma.user.update({
              where: { id: userId },
              data: { lastActivity: new Date() },
            });
          }
        } catch (_error) {
          // Silently fail
        }
      }
    },
  },
});
