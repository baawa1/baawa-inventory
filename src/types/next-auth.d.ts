import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      status: string;
      isEmailVerified: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    role: string;
    status: string;
    isEmailVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    status: string;
    isEmailVerified: boolean;
  }
}
