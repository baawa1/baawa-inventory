import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authService } from "./auth-service";
import { AuditLogger } from "./utils/audit-logger";
import { SessionBlacklist } from "./session-blacklist";
import { logger } from "./logger";

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      status: string;
      emailVerified: boolean;
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    emailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    status: string;
    emailVerified: boolean;
    loginTime?: number;
    expired?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const result = await authService.validateCredentials(
          credentials.email,
          credentials.password
        );

        if (result.success && result.user) {
          return result.user;
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 60 * 60, // Update session every hour
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60, // 24 hours
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Check if session is blacklisted
      if (
        token.sub &&
        (await SessionBlacklist.isSessionBlacklisted(token.sub))
      ) {
        logger.session("Session is blacklisted, invalidating", {
          sessionId: token.sub.slice(-8),
        });
        return {
          role: "",
          status: "",
          emailVerified: false,
          expired: true,
        } as any;
      }

      // Handle new login
      if (user) {
        token.role = user.role;
        token.status = user.status;
        token.emailVerified = Boolean(user.emailVerified);
        token.loginTime = Date.now();
        logger.auth("JWT callback: New login, setting token data", {
          role: token.role,
          status: token.status,
          emailVerified: token.emailVerified,
        });
      }

      // Handle session updates (when update() is called)
      if (trigger === "update" && token.sub) {
        logger.session("JWT callback: Refreshing user data for user", {
          userId: token.sub,
        });
        const userId = parseInt(token.sub);
        const refreshedData = await authService.refreshUserData(userId);

        if (refreshedData) {
          logger.session(
            "JWT callback: Received refreshed data",
            refreshedData
          );
          token.role = refreshedData.role || token.role;
          token.status = refreshedData.status || token.status;
          token.emailVerified =
            refreshedData.emailVerified !== undefined
              ? Boolean(refreshedData.emailVerified)
              : token.emailVerified;
        } else {
          logger.warn("JWT callback: No refreshed data received for user", {
            userId,
          });
        }

        // Override with any session data provided
        if (session?.user?.status) {
          token.status = session.user.status;
        }
        if (session?.user?.emailVerified !== undefined) {
          token.emailVerified = session.user.emailVerified;
        }
      }

      // Ensure required properties are always present
      if (!token.status && token.sub) {
        logger.session(
          "JWT callback: Missing status, fetching from database for user",
          { userId: token.sub }
        );
        const userId = parseInt(token.sub);
        const refreshedData = await authService.refreshUserData(userId);
        if (refreshedData) {
          token.role = refreshedData.role || token.role || "EMPLOYEE";
          token.status = refreshedData.status || "PENDING";
          token.emailVerified = refreshedData.emailVerified || false;
          logger.session("JWT callback: Set missing status", {
            status: token.status,
          });
        }
      }

      // Check if session is expired and invalidate completely
      if (
        token.loginTime &&
        Date.now() - (token.loginTime as number) > 24 * 60 * 60 * 1000
      ) {
        // Session is expired - blacklist it and invalidate completely
        if (token.sub) {
          const userId = parseInt(token.sub);
          await SessionBlacklist.blacklistSession(
            token.sub,
            userId,
            "session_expired"
          );
          await authService.updateLastLogout(userId);
          await AuditLogger.logSessionExpired(userId, token.email || "unknown");
        }
        return {
          role: "",
          status: "",
          emailVerified: false,
          expired: true,
        } as any;
      }

      logger.debug("JWT callback: Final token data", {
        sub: token.sub,
        role: token.role,
        status: token.status,
        emailVerified: token.emailVerified,
      });

      return token;
    },
    async session({ session, token }) {
      // If token is empty or expired, return null to invalidate session
      if (!token || !token.sub || token.expired) {
        logger.session(
          "Session callback: Token is empty or expired, invalidating session"
        );
        return null as any;
      }

      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role || "EMPLOYEE";
        session.user.status = token.status || "PENDING";
        session.user.emailVerified = Boolean(token.emailVerified);

        logger.debug("Session callback: Setting session user data", {
          id: session.user.id,
          role: session.user.role,
          status: session.user.status,
          emailVerified: session.user.emailVerified,
        });
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sub) {
        const userId = parseInt(token.sub);
        await SessionBlacklist.blacklistSession(
          token.sub,
          userId,
          "manual_logout"
        );
        await authService.updateLastLogout(userId);
        await AuditLogger.logLogout(userId, token.email || "unknown");
      }
    },
    async session({ session }) {
      if (session?.user?.id) {
        const userId = parseInt(session.user.id);
        await authService.updateLastActivity(userId);
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
