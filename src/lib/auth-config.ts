import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authService } from "./auth-service";

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
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Handle new login
      if (user) {
        token.role = user.role;
        token.status = user.status;
        token.emailVerified = Boolean(user.emailVerified);
        token.loginTime = Date.now();
      }

      // Handle session updates (when update() is called)
      if (trigger === "update" && token.sub) {
        const userId = parseInt(token.sub);
        const refreshedData = await authService.refreshUserData(userId);

        if (refreshedData) {
          token.role = refreshedData.role || token.role;
          token.status = refreshedData.status || token.status;
          token.emailVerified =
            refreshedData.emailVerified !== undefined
              ? Boolean(refreshedData.emailVerified)
              : token.emailVerified;
        }

        // Override with any session data provided
        if (session?.user?.status) {
          token.status = session.user.status;
        }
        if (session?.user?.emailVerified !== undefined) {
          token.emailVerified = session.user.emailVerified;
        }
      }

      // Check if session is expired
      if (
        token.loginTime &&
        Date.now() - (token.loginTime as number) > 24 * 60 * 60 * 1000
      ) {
        return {
          ...token,
          expired: true,
        };
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sub) {
        const userId = parseInt(token.sub);
        await authService.updateLastLogout(userId);
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
