import { NextAuthOptions } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      status: string;
      image?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
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
