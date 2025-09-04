import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './src/lib/db';
import * as bcrypt from 'bcryptjs';
import { AccountLockout } from './src/lib/utils/account-lockout';
import { AuditLogger } from './src/lib/utils/audit-logger';
import type { UserRole, UserStatus } from './src/types/user';

// Extend NextAuth types for better type safety
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    firstName: string;
    lastName: string;
    isActive: boolean;
    userStatus: UserStatus;
    createdAt: Date | string;
    phone?: string;
    lastLogin?: Date | string;
    avatar_url?: string;
    image?: string | null; // Allow NextAuth's default null handling
  }

  interface Session {
    user: User & {
      id: string;
      image?: string | null; // Match NextAuth's default type
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    firstName: string;
    lastName: string;
    isActive: boolean;
    userStatus: UserStatus;
    createdAt: Date | string;
    phone?: string;
    lastLogin?: Date | string;
    avatar_url?: string;
    dataFetchedAt?: number;
  }
}

/**
 * Comprehensive edge runtime detection to prevent database calls during middleware
 */
function isRunningInEdgeRuntime(): boolean {
  return (
    process.env.NEXT_RUNTIME === 'edge' ||
    typeof (globalThis as any).EdgeRuntime !== 'undefined' ||
    (typeof (globalThis as any).navigator !== 'undefined' && 
     (globalThis as any).navigator.userAgent?.includes?.('Next.js Middleware')) ||
    // Check if we're in middleware context by checking for specific globals
    (typeof (globalThis as any).Request !== 'undefined' && 
     typeof (globalThis as any).crypto !== 'undefined' &&
     typeof process.versions?.node === 'undefined') // Edge runtime doesn't have Node.js
  );
}

/**
 * Check if database operations are safe to perform
 */
function isDatabaseSafe(): boolean {
  return !isRunningInEdgeRuntime() && typeof prisma?.user?.findUnique === 'function';
}

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
              phone: true,
              lastLogin: true,
              avatar_url: true,
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
        // Type-safe assignment using the extended User interface
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

      // Only perform database operations if we're in a safe runtime environment
      if (
        token.sub &&
        shouldFetchFreshData &&
        typeof window === 'undefined' &&
        isDatabaseSafe()
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
              phone: true,
              lastLogin: true,
              avatar_url: true,
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
            token.phone = freshUser.phone || undefined;
            token.lastLogin = freshUser.lastLogin || undefined;
            token.avatar_url = freshUser.avatar_url || undefined;
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
        // Type-safe assignment using the extended Session interface
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.isEmailVerified = Boolean(token.isEmailVerified);
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.isActive = Boolean(token.isActive);
        session.user.userStatus = token.userStatus;
        session.user.createdAt = token.createdAt;
        session.user.phone = token.phone;
        session.user.lastLogin = token.lastLogin;
        session.user.avatar_url = token.avatar_url;

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
      if (message.user && isDatabaseSafe()) {
        // Log successful sign-in (skip in edge runtime)
        try {
          await AuditLogger.logLoginSuccess(
            parseInt(message.user.id),
            message.user.email || 'unknown'
          );
        } catch (error) {
          // Silently fail in edge runtime
        }
      }
    },
    async signOut(message) {
      if ('token' in message && message.token?.sub && isDatabaseSafe()) {
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
          }
        } catch (_error) {
          // Error during signOut event - silently fail
        }
      }
    },
    async session(message) {
      if ('token' in message && message.token?.sub && isDatabaseSafe()) {
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
          }
        } catch (_error) {
          // Error during session event - silently fail
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
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://') || process.env.NODE_ENV === 'production',
  secret: process.env.NEXTAUTH_SECRET,
  
  // Enhanced JWT options with security considerations
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
    // NextAuth handles encryption automatically based on secret strength
  },
  
  // Cookie security configuration
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production' || process.env.NEXTAUTH_URL?.startsWith('https://'),
        domain: process.env.NODE_ENV === 'production' ? process.env.NEXTAUTH_DOMAIN : undefined,
      },
    },
  },
  
  // Enhanced debug logging in development only
  debug: process.env.NODE_ENV === 'development' && process.env.NEXTAUTH_DEBUG === 'true',
  
  // Conditional trust host - more secure
  trustHost: process.env.VERCEL === '1' || process.env.NODE_ENV === 'development',
};

export const { auth, handlers, signIn, signOut } = NextAuth(config);
