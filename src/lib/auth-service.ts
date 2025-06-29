import { createServerSupabaseClient } from "./supabase-server";
import * as bcrypt from "bcryptjs";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  emailVerified: boolean;
}

export interface AuthValidationResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

export class AuthenticationService {
  /**
   * Validate user credentials and return user data if valid
   */
  async validateCredentials(
    email: string,
    password: string
  ): Promise<AuthValidationResult> {
    try {
      const supabase = await createServerSupabaseClient();

      // Get user from our users table
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      if (error || !user) {
        return { success: false, error: "INVALID_CREDENTIALS" };
      }

      // Check if email is verified
      if (!user.email_verified) {
        return { success: false, error: "UNVERIFIED_EMAIL" };
      }

      // Check user status
      const statusValidation = this.validateUserStatus(user.user_status);
      if (!statusValidation.success) {
        return statusValidation;
      }

      // Verify password with bcrypt
      const isValidPassword = await bcrypt.compare(
        password,
        user.password_hash || "$2a$10$dummy.hash.for.testing"
      );

      if (!isValidPassword) {
        return { success: false, error: "INVALID_CREDENTIALS" };
      }

      // Update last login timestamp
      await this.updateLastLogin(user.id);

      return {
        success: true,
        user: {
          id: user.id.toString(),
          email: user.email,
          name: `${user.first_name} ${user.last_name}`,
          role: user.role,
          status: user.user_status,
          emailVerified: user.email_verified,
        },
      };
    } catch (error) {
      console.error("Authentication error:", error);
      return { success: false, error: "AUTHENTICATION_FAILED" };
    }
  }

  /**
   * Validate user status for login eligibility
   */
  private validateUserStatus(status: string): AuthValidationResult {
    switch (status) {
      case "PENDING":
        return { success: false, error: "PENDING_VERIFICATION" };
      case "REJECTED":
        return { success: false, error: "ACCOUNT_REJECTED" };
      case "SUSPENDED":
        return { success: false, error: "ACCOUNT_SUSPENDED" };
      case "VERIFIED":
      case "APPROVED":
        return { success: true };
      default:
        return { success: false, error: "ACCOUNT_INACTIVE" };
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(userId: number): Promise<void> {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase
        .from("users")
        .update({
          last_login: new Date().toISOString(),
        })
        .eq("id", userId);
    } catch (error) {
      console.error("Error updating last login:", error);
    }
  }

  /**
   * Update user's last logout timestamp
   */
  async updateLastLogout(userId: number): Promise<void> {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase
        .from("users")
        .update({
          last_logout: new Date().toISOString(),
        })
        .eq("id", userId);
    } catch (error) {
      console.error("Error updating logout time:", error);
    }
  }

  /**
   * Update user's last activity timestamp
   */
  async updateLastActivity(userId: number): Promise<void> {
    try {
      const supabase = await createServerSupabaseClient();
      await supabase
        .from("users")
        .update({
          last_activity: new Date().toISOString(),
        })
        .eq("id", userId);
    } catch (error) {
      console.error("Error updating last activity:", error);
    }
  }

  /**
   * Refresh user data from database
   */
  async refreshUserData(userId: number): Promise<Partial<AuthUser> | null> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: user, error } = await supabase
        .from("users")
        .select("role, user_status, email_verified")
        .eq("id", userId)
        .eq("is_active", true)
        .single();

      if (error || !user) {
        return null;
      }

      return {
        role: user.role,
        status: user.user_status,
        emailVerified: user.email_verified,
      };
    } catch (error) {
      console.error("Error refreshing user data:", error);
      return null;
    }
  }
}

// Export singleton instance
export const authService = new AuthenticationService();
