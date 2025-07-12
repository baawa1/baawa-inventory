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
    updateAge: 2 * 60 * 60, // Update session every 2 hours
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Store user data in JWT on sign in
      if (user) {
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.isEmailVerified = Boolean((user as any).isEmailVerified);
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
      }

      // Handle session updates
      if (trigger === "update" && session) {
        token.role = session.role || token.role;
        token.status = session.status || token.status;
        token.isEmailVerified = Boolean(
          session.isEmailVerified ?? token.isEmailVerified
        );
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
  debug: false, // Disabled to reduce console noise
  // Trust host for deployment
  trustHost: true,
};

export const { auth, handlers, signIn, signOut } = NextAuth(config);
