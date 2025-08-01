import { DefaultSession, DefaultUser } from "next-auth";
import { JWT, DefaultJWT } from "next-auth/jwt";
import type { UserRole, UserStatus } from "@/types/user";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: UserRole;
      status: UserStatus;
      isEmailVerified: boolean;
      firstName: string;
      lastName: string;
      isActive: boolean;
      userStatus: UserStatus;
      createdAt: string | Date;
      phone?: string;
      lastLogin?: string | Date;
      avatar_url?: string;
      image?: string;
    } & Omit<DefaultSession["user"], "name" | "email">;
  }

  interface User {
    id: string;
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    firstName: string;
    lastName: string;
    isActive: boolean;
    userStatus: UserStatus;
    createdAt: string | Date;
    phone?: string;
    lastLogin?: string | Date;
    avatar_url?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: UserRole;
    status: UserStatus;
    isEmailVerified: boolean;
    firstName: string;
    lastName: string;
    isActive: boolean;
    userStatus: UserStatus;
    createdAt: string | Date;
    phone?: string;
    lastLogin?: string | Date;
    avatar_url?: string;
  }
}
