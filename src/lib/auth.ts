import { NextAuthOptions } from "next-auth";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { createClient } from "@supabase/supabase-js";
import CredentialsProvider from "next-auth/providers/credentials";
import { createServerSupabaseClient } from "@/lib/supabase";
import bcrypt from "bcryptjs";

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

// Create Supabase client for NextAuth adapter
const supabaseForAuth = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin operations
);

export const authOptions: NextAuthOptions = {
  // For now, we'll only use credentials provider without adapter
  // adapter: SupabaseAdapter({
  //   url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  //   secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  // }),
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

        try {
          const supabase = await createServerSupabaseClient();

          // Get user from our users table
          const { data: user, error } = await supabase
            .from("users")
            .select("*")
            .eq("email", credentials.email)
            .eq("is_active", true)
            .single();

          if (error || !user) {
            return null;
          }

          // Check if email is verified
          if (!user.email_verified) {
            throw new Error("UNVERIFIED_EMAIL");
          }

          // Check user status - allow VERIFIED and APPROVED users to login
          if (user.user_status === "PENDING") {
            throw new Error("PENDING_VERIFICATION");
          } else if (user.user_status === "REJECTED") {
            throw new Error("ACCOUNT_REJECTED");
          } else if (user.user_status === "SUSPENDED") {
            throw new Error("ACCOUNT_SUSPENDED");
          } else if (!["VERIFIED", "APPROVED"].includes(user.user_status)) {
            throw new Error("ACCOUNT_INACTIVE");
          }

          // Verify password with bcrypt
          console.log("🔐 Debug: Attempting password verification...");
          console.log("📧 Email:", credentials.email);
          console.log("🔑 Password hash exists:", !!user.password_hash);
          console.log(
            "🔑 Hash (first 20 chars):",
            user.password_hash?.substring(0, 20) + "..."
          );

          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password_hash || "$2a$10$dummy.hash.for.testing"
          );

          console.log("✅ Password valid:", isValidPassword);

          if (isValidPassword) {
            // Update last login timestamp
            await supabase
              .from("users")
              .update({
                last_login: new Date().toISOString(),
                // Update session tracking if needed
              })
              .eq("id", user.id);

            return {
              id: user.id.toString(),
              email: user.email,
              name: `${user.first_name} ${user.last_name}`,
              role: user.role,
              status: user.user_status,
              emailVerified: user.email_verified,
            };
          }

          return null;
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
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
      if (user) {
        token.role = (user as any).role;
        token.status = (user as any).status;
        token.emailVerified = (user as any).emailVerified;
        token.loginTime = Date.now();
      }

      // Handle session updates (when update() is called)
      if (trigger === "update") {
        console.log("JWT update triggered");

        // Always fetch fresh data from database when update() is called
        if (token.sub) {
          try {
            const supabase = await createServerSupabaseClient();
            const { data: user, error } = await supabase
              .from("users")
              .select("role, user_status, email_verified")
              .eq("id", parseInt(token.sub))
              .eq("is_active", true)
              .single();

            if (!error && user) {
              const oldStatus = token.status;
              token.role = user.role;
              token.status = user.user_status;
              token.emailVerified = user.email_verified;
              console.log("JWT token refreshed from database:", {
                oldStatus,
                newStatus: user.user_status,
                emailVerified: user.email_verified,
              });
            } else {
              console.error(
                "Error fetching user data for token refresh:",
                error
              );
            }
          } catch (error) {
            console.error("Error refreshing token from database:", error);
          }
        }

        // Override with any session data provided (if explicitly passed)
        if (session?.user?.status) {
          token.status = session.user.status;
        }
        if (session?.user?.emailVerified !== undefined) {
          token.emailVerified = session.user.emailVerified;
        }
      }

      // Check if session is expired (optional additional check)
      if (
        token.loginTime &&
        Date.now() - (token.loginTime as number) > 24 * 60 * 60 * 1000
      ) {
        // Return a minimal token to force re-authentication
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
        (session.user as any).emailVerified = token.emailVerified;
      }
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      // Additional cleanup on signout
      if (token?.sub) {
        try {
          const supabase = await createServerSupabaseClient();

          // Optional: Update user's last_logout timestamp
          await supabase
            .from("users")
            .update({
              last_logout: new Date().toISOString(),
            })
            .eq("id", parseInt(token.sub));
        } catch (error) {
          console.error("Error updating logout time:", error);
        }
      }
    },
    async session({ session }) {
      // Track active sessions (optional)
      if (session?.user?.id) {
        try {
          const supabase = await createServerSupabaseClient();

          // Update last activity
          await supabase
            .from("users")
            .update({
              last_activity: new Date().toISOString(),
            })
            .eq("id", parseInt(session.user.id));
        } catch (error) {
          console.error("Error updating last activity:", error);
        }
      }
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
