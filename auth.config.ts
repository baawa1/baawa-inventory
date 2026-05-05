import type { NextAuthConfig } from 'next-auth';
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
    image?: string | null;
  }

  interface Session {
    user: User & {
      id: string;
      image?: string | null;
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
 * Edge-compatible auth configuration
 * This file contains ONLY the configuration that can run in Edge Runtime
 * NO database imports (Prisma), NO bcrypt, NO heavy dependencies
 */
export const authConfig: NextAuthConfig = {
  providers: [], // Providers are added in auth.ts (server-side only)
  session: {
    strategy: 'jwt' as const,
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: process.env.NODE_ENV === 'development' ? 15 * 60 : 5 * 60,
  },
  callbacks: {
    // JWT callback for Edge - only handles token data, no database calls
    async jwt({ token, user }) {
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
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
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

        if (token.firstName && token.lastName) {
          session.user.name = `${token.firstName} ${token.lastName}`;
        }
      }
      return session;
    },
    async signIn({ user }) {
      return !!user;
    },
    // authorized callback - basic auth check only
    // Detailed authorization logic is handled in middleware.ts
    authorized({ auth: _auth }) {
      // Return true to let middleware handle all authorization logic
      // This prevents double-checking and keeps logic centralized
      // The middleware will properly redirect unauthenticated users
      return true;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/login',
  },
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://') || process.env.NODE_ENV === 'production',
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    maxAge: 24 * 60 * 60,
  },
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
  debug: process.env.NODE_ENV === 'development' && process.env.NEXTAUTH_DEBUG === 'true',
  trustHost: process.env.VERCEL === '1' || process.env.NODE_ENV === 'development',
};
