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
        if (!email || !password) return null;
        try {
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
          const user = await prisma.user.findFirst({
            where: { email, isActive: true },
            select: {
              id: true,
              email: true,
              password: true,
              firstName: true,
              lastName: true,
              role: true,
              userStatus: true,
              emailVerified: true,
            },
          });
          if (!user) {
            await AuditLogger.logLoginFailed(email, "User not found");
            return null;
          }
          if (!user.emailVerified) {
            await AuditLogger.logLoginFailed(email, "Email not verified");
            return null;
          }
          if (
            ["PENDING", "REJECTED", "SUSPENDED"].includes(user.userStatus || "")
          ) {
            await AuditLogger.logLoginFailed(
              email,
              `User status: ${user.userStatus || "UNKNOWN"}`
            );
            return null;
          }
          if (!user.password) {
            await AuditLogger.logLoginFailed(email, "No password set");
            return null;
          }
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            await AuditLogger.logLoginFailed(email, "Invalid password");
            return null;
          }
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
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
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.status = user.status;
        token.isEmailVerified = Boolean(user.isEmailVerified);
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.status = token.status as string;
        session.user.isEmailVerified = Boolean(token.isEmailVerified);
      }
      return session;
    },
  },
  events: {
    async signOut(message) {
      if ("token" in message && message.token?.sub) {
        const userId = parseInt(message.token.sub);
        await prisma.user.update({
          where: { id: userId },
          data: { lastLogout: new Date() },
        });
        await AuditLogger.logLogout(userId, message.token.email || "unknown");
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export const { auth, handlers } = NextAuth(config);
