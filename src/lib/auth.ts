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
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
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

          // Verify password with bcrypt
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password_hash || "$2a$10$dummy.hash.for.testing"
          );

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
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.loginTime = Date.now();
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
