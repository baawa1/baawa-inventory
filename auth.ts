import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./src/lib/db";
import * as bcrypt from "bcryptjs";
import { AccountLockout } from "./src/lib/utils/account-lockout";
import { AuditLogger } from "./src/lib/utils/audit-logger";

const config: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const email = credentials?.email as string;
        const password = credentials?.password as string;

        if (!email || !password) {
          await AuditLogger.logLoginFailed(
            email || "unknown",
            "Missing credentials"
          );
          return null;
        }

        try {
          // Check account lockout status
          const emailLockoutStatus = await AccountLockout.checkLockoutStatus(
            email,
            "email"
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
            req.headers?.get("x-forwarded-for") ||
            req.headers?.get("x-real-ip") ||
            "unknown";
          const ipLockoutStatus = await AccountLockout.checkLockoutStatus(
            ipAddress,
            "ip"
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
            await AuditLogger.logLoginFailed(email, "User not found");
            return null;
          }

          // Validate password first
          if (!user.password) {
            await AuditLogger.logLoginFailed(email, "No password set");
            return null;
          }

          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            await AuditLogger.logLoginFailed(email, "Invalid password");
            return null;
          }

          // Allow login for all active users regardless of status
          // The middleware will handle redirects based on status
          if (!user.isActive) {
            await AuditLogger.logLoginFailed(email, "User account is inactive");
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
            status: user.userStatus || "PENDING",
            isEmailVerified: Boolean(user.emailVerified),
            firstName: user.firstName,
            lastName: user.lastName,
          };
        } catch (error) {
          console.error("Authentication error:", error);
          await AuditLogger.logLoginFailed(email, "Authentication failed");
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 5 * 60, // Update session every 5 minutes instead of every request
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      // Only fetch fresh data from database on initial sign-in or when explicitly triggered
      if (user) {
        console.log("🔄 Initial login - using user object data:", {
          status: (user as any).status,
          role: (user as any).role,
          emailVerified: (user as any).isEmailVerified,
        });

        token.role = (user as any).role;
        token.status = (user as any).status;
        token.isEmailVerified = Boolean((user as any).isEmailVerified);
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;

        // Add timestamp to track when data was last fetched
        token.dataFetchedAt = Date.now();
      }

      // Only fetch fresh data if it's been more than 5 minutes since last fetch
      // or if this is a token refresh trigger
      const shouldFetchFreshData =
        trigger === "update" ||
        !token.dataFetchedAt ||
        Date.now() - (token.dataFetchedAt as number) > 5 * 60 * 1000; // 5 minutes

      if (token.sub && shouldFetchFreshData && typeof window === "undefined") {
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
            },
          });

          if (freshUser) {
            console.log("✅ Fresh data fetched from database:", {
              status: freshUser.userStatus,
              role: freshUser.role,
              emailVerified: freshUser.emailVerified,
              firstName: freshUser.firstName,
              lastName: freshUser.lastName,
              trigger: trigger || "timeout",
            });

            // Update token with fresh data from database
            token.role = freshUser.role;
            token.status = freshUser.userStatus || "PENDING";
            token.isEmailVerified = Boolean(freshUser.emailVerified);
            token.firstName = freshUser.firstName;
            token.lastName = freshUser.lastName;
            token.dataFetchedAt = Date.now();
          } else {
            console.log("❌ User not found in database during JWT callback");
          }
        } catch (error) {
          console.error("❌ Error fetching fresh user data:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
        session.user.isEmailVerified = Boolean(token.isEmailVerified);
        (session.user as any).firstName = token.firstName as string;
        (session.user as any).lastName = token.lastName as string;

        // Update the name field with fresh firstName and lastName
        if (token.firstName && token.lastName) {
          session.user.name = `${token.firstName} ${token.lastName}`;
        }

        // Only log session updates in development and when there are significant changes
        if (process.env.NODE_ENV === "development" && token.dataFetchedAt) {
          console.log("🔄 Session updated with fresh data:", {
            name: session.user.name,
            role: session.user.role,
            status: session.user.status,
            dataFetchedAt: new Date(
              token.dataFetchedAt as number
            ).toISOString(),
          });
        }
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
          message.user.email || "unknown"
        );
      }
    },
    async signOut(message) {
      if ("token" in message && message.token?.sub) {
        const userId = parseInt(message.token.sub);
        const userEmail = message.token.email as string;

        // Update last logout timestamp
        await prisma.user.update({
          where: { id: userId },
          data: { lastLogout: new Date() },
        });

        // Log logout event
        await AuditLogger.logLogout(userId, userEmail || "unknown");
      }
    },
    async session(message) {
      if ("token" in message && message.token?.sub) {
        const userId = parseInt(message.token.sub);

        // Update last activity timestamp
        await prisma.user.update({
          where: { id: userId },
          data: { lastActivity: new Date() },
        });
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
    verifyRequest: "/check-email",
    newUser: "/register",
  },
  // Enhanced security settings
  useSecureCookies: process.env.NODE_ENV === "production",
  secret: process.env.NEXTAUTH_SECRET,
  // Enhanced JWT options
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  // Enhanced debug logging in development
  debug: process.env.NODE_ENV === "development", // Only in development
  // Trust host for deployment
  trustHost: true,
};

export const { auth, handlers, signIn, signOut } = NextAuth(config);
