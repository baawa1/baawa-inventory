/**
 * Centralized API Authentication Middleware
 * Provides consistent authentication and authorization across all API endpoints
 */

import { NextRequest } from "next/server";
import type { UserRole, UserStatus } from "@/types/user";

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    status: UserStatus;
  };
}
