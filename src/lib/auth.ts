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
            .eq("isActive", true)
            .single();

          if (error || !user) {
            return null;
          }

          // Verify password with bcrypt
          // Note: In production, passwords should be hashed when storing users
          // For now, we'll check against a test password
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.passwordHash || "$2a$10$dummy.hash.for.testing"
          );

          if (isValidPassword) {
            return {
              id: user.id.toString(),
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
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
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
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
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
