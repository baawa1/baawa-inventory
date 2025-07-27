import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './src/lib/db';
import * as bcrypt from 'bcryptjs';
import { AccountLockout } from './src/lib/utils/account-lockout';
import { AuditLogger } from './src/lib/utils/audit-logger';

const config: NextAuthConfig = {
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
            'Missing credentials'
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
            await AuditLogger.logLoginFailed(
              email,
              `Account locked: ${AccountLockout.getLockoutMessage(emailLockoutStatus)}`
            );
            return null;
          }

          // Check IP lockout status
          const ipAddress =
            req.headers?.get('x-forwarded-for') ||
            req.headers?.get('x-real-ip') ||
            'unknown';
          const ipLockoutStatus = await AccountLockout.checkLockoutStatus(
            ipAddress,
            'ip'
          );
          if (ipLockoutStatus.isLocked) {
            await AuditLogger.logLoginFailed(
              email,
              `IP locked: ${AccountLockout.getLockoutMessage(ipLockoutStatus)}`
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
            },
          });

          if (!user) {
            await AuditLogger.logLoginFailed(email, 'User not found');
            return null;
          }

          // Validate password first
          if (!user.password) {
            await AuditLogger.logLoginFailed(email, 'No password set');
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            await AuditLogger.logLoginFailed(email, 'Invalid password');
            return null;
          }

          // Allow login for all active users regardless of status
          // The middleware will handle redirects based on status
          if (!user.isActive) {
            await AuditLogger.logLoginFailed(email, 'User account is inactive');
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
          await AuditLogger.logLoginSuccess(user.id, user.email);

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
          await AuditLogger.logLoginFailed(email, 'Authentication failed');
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: process.env.NODE_ENV === 'development' ? 15 * 60 : 5 * 60, // 15 minutes in dev, 5 minutes in prod
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Only fetch fresh data from database on initial sign-in or when explicitly triggered
      if (user) {
        // Debug logging removed for production

        token.role = (user as any).role;
        token.status = (user as any).status;
        token.isEmailVerified = Boolean((user as any).isEmailVerified);
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.isActive = Boolean((user as any).isActive);
        token.userStatus = (user as any).userStatus;
        token.createdAt = (user as any).createdAt;

        // Add timestamp to track when data was last fetched
        token.dataFetchedAt = Date.now();
      }

      // Only fetch fresh data if it's been more than 5 minutes since last fetch
      // or if this is a token refresh trigger
      // BUT NOT in middleware/edge runtime environment
      const shouldFetchFreshData =
        trigger === 'update' ||
        !token.dataFetchedAt ||
        Date.now() - (token.dataFetchedAt as number) >
          (process.env.NODE_ENV === 'development'
            ? 15 * 60 * 1000
            : 5 * 60 * 1000); // 15 minutes in dev, 5 minutes in prod

      // Check if we're in Edge Runtime (middleware) - if so, skip database calls
      const isEdgeRuntime =
        process.env.NEXT_RUNTIME === 'edge' ||
        typeof (globalThis as any).EdgeRuntime !== 'undefined';

      if (
        token.sub &&
        shouldFetchFreshData &&
        typeof window === 'undefined' &&
        !isEdgeRuntime
      ) {
        try {
          // Fetch fresh user data from database
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
            },
          });

          if (freshUser) {
            // Debug logging removed for production

            // Update token with fresh data from database
            token.role = freshUser.role;
            token.status = freshUser.userStatus || 'PENDING';
            token.isEmailVerified = Boolean(freshUser.emailVerified);
            token.firstName = freshUser.firstName;
            token.lastName = freshUser.lastName;
            token.isActive = freshUser.isActive;
            token.userStatus = freshUser.userStatus || 'PENDING';
            token.createdAt = freshUser.createdAt || new Date();
            token.dataFetchedAt = Date.now();
          } else {
            // User not found in database
          }
        } catch (_error) {
          // Error fetching fresh user data
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as any;
        session.user.status = token.status as any;
        session.user.isEmailVerified = Boolean(token.isEmailVerified);
        session.user.firstName = token.firstName as string;
        session.user.lastName = token.lastName as string;
        session.user.isActive = Boolean(token.isActive);
        session.user.userStatus = token.userStatus as any;
        session.user.createdAt = token.createdAt as string | Date;

        // Update the name field with fresh firstName and lastName
        if (token.firstName && token.lastName) {
          session.user.name = `${token.firstName} ${token.lastName}`;
        }

        // Debug logging removed for production
      }
      return session;
    },
    async signIn({ user, account: _account, profile: _profile }) {
      // Additional sign-in checks can be added here
      // For now, return true to allow sign-in if user object is valid
      return !!user;
    },
  },
  events: {
    async signIn(message) {
      if (message.user) {
        // Log successful sign-in
        await AuditLogger.logLoginSuccess(
          parseInt(message.user.id),
          message.user.email || 'unknown'
        );
      }
    },
    async signOut(message) {
      if ('token' in message && message.token?.sub) {
        const userId = parseInt(message.token.sub);
        const userEmail = message.token.email as string;

        try {
          // Check if user exists before updating
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
          });

          if (user) {
            // Update last logout timestamp
            await prisma.user.update({
              where: { id: userId },
              data: { lastLogout: new Date() },
            });

            // Log logout event
            await AuditLogger.logLogout(userId, userEmail || 'unknown');
          } else {
            // User not found during signOut event
          }
        } catch (_error) {
          // Error during signOut event
        }
      }
    },
    async session(message) {
      if ('token' in message && message.token?.sub) {
        const userId = parseInt(message.token.sub);

        try {
          // Check if user exists before updating
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
          });

          if (user) {
            // Update last activity timestamp
            await prisma.user.update({
              where: { id: userId },
              data: { lastActivity: new Date() },
            });
          } else {
            // User not found during session event
          }
        } catch (_error) {
          // Error during session event
        }
      }
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    verifyRequest: '/check-email',
    newUser: '/register',
  },
  // Enhanced security settings
  useSecureCookies: process.env.NODE_ENV === 'production',
  secret: process.env.NEXTAUTH_SECRET,
  // Enhanced JWT options
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  // Enhanced debug logging in development
  debug: false, // Disabled to reduce console noise in development
  // Trust host for deployment
  trustHost: true,
};

export const { auth, handlers, signIn, signOut } = NextAuth(config);
