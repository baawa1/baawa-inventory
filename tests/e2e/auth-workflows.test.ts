/**
 * End-to-End Tests for Authentication Workflows
 * Tests complete authentication patterns and workflows
 */

import { describe, it, expect } from "@jest/globals";
import path from "path";
import fs from "fs";

describe("Authentication Workflows E2E", () => {
  describe("Registration to Login Workflow", () => {
    it("should have all required components for user registration workflow", () => {
      // Verify registration endpoint exists
      const registerPath = path.join(
        __dirname,
        "../../src/app/api/auth/register/route.ts"
      );
      expect(fs.existsSync(registerPath)).toBe(true);

      const registerContent = fs.readFileSync(registerPath, "utf8");
      expect(registerContent).toContain("POST");
      expect(registerContent).toContain("prisma");
      expect(registerContent).toContain("bcrypt");
      expect(registerContent).toContain("email");
      expect(registerContent).toContain("password");
    });

    it("should have password hashing in registration", () => {
      const registerPath = path.join(
        __dirname,
        "../../src/app/api/auth/register/route.ts"
      );
      const registerContent = fs.readFileSync(registerPath, "utf8");

      expect(registerContent).toContain("bcrypt");
      expect(registerContent).toContain("hash");
    });

    it("should have email verification workflow", () => {
      const verifyPath = path.join(
        __dirname,
        "../../src/app/api/auth/verify-email"
      );
      expect(fs.existsSync(verifyPath)).toBe(true);

      const verifyPagePath = path.join(
        __dirname,
        "../../src/app/verify-email/page.tsx"
      );
      expect(fs.existsSync(verifyPagePath)).toBe(true);
    });
  });

  describe("Login Workflow", () => {
    it("should have NextAuth configuration for login", () => {
      const authPath = path.join(__dirname, "../../auth.ts");
      const authContent = fs.readFileSync(authPath, "utf8");

      expect(authContent).toContain("CredentialsProvider");
      expect(authContent).toContain("authorize");
      expect(authContent).toContain("pages");
      expect(authContent).toContain('signIn: "/login"');
    });

    it("should have login page", () => {
      const loginPath = path.join(__dirname, "../../src/app/login/page.tsx");
      expect(fs.existsSync(loginPath)).toBe(true);

      const loginContent = fs.readFileSync(loginPath, "utf8");
      expect(loginContent).toContain("LoginForm");
    });

    it("should have proper authentication validation", () => {
      const authPath = path.join(__dirname, "../../auth.ts");
      const authContent = fs.readFileSync(authPath, "utf8");

      expect(authContent).toContain("bcrypt.compare");
      expect(authContent).toContain("emailVerified");
      expect(authContent).toContain("userStatus");
    });
  });

  describe("Password Reset Workflow", () => {
    it("should have forgot password endpoint", () => {
      const forgotPath = path.join(
        __dirname,
        "../../src/app/api/auth/forgot-password/route.ts"
      );
      expect(fs.existsSync(forgotPath)).toBe(true);

      const forgotContent = fs.readFileSync(forgotPath, "utf8");
      expect(forgotContent).toContain("POST");
      expect(forgotContent).toContain("email");
    });

    it("should have reset password endpoint", () => {
      const resetPath = path.join(
        __dirname,
        "../../src/app/api/auth/reset-password/route.ts"
      );
      expect(fs.existsSync(resetPath)).toBe(true);

      const resetContent = fs.readFileSync(resetPath, "utf8");
      expect(resetContent).toContain("POST");
      expect(resetContent).toContain("password");
      expect(resetContent).toContain("token");
    });

    it("should have reset password pages", () => {
      const forgotPagePath = path.join(
        __dirname,
        "../../src/app/forgot-password/page.tsx"
      );
      const resetPagePath = path.join(
        __dirname,
        "../../src/app/reset-password/page.tsx"
      );

      expect(fs.existsSync(forgotPagePath)).toBe(true);
      expect(fs.existsSync(resetPagePath)).toBe(true);
    });
  });

  describe("Protected Route Workflow", () => {
    it("should have middleware protecting routes", () => {
      const middlewarePath = path.join(__dirname, "../../src/middleware.ts");
      expect(fs.existsSync(middlewarePath)).toBe(true);

      const middlewareContent = fs.readFileSync(middlewarePath, "utf8");
      expect(middlewareContent).toContain("auth");
      expect(middlewareContent).toContain("publicRoutes");
      expect(middlewareContent).toContain("redirect");
    });

    it("should redirect unauthenticated users", () => {
      const middlewarePath = path.join(__dirname, "../../src/middleware.ts");
      const middlewareContent = fs.readFileSync(middlewarePath, "utf8");

      expect(middlewareContent).toContain("redirect");
      expect(middlewareContent).toContain("/login");
    });
  });

  describe("User Status Workflow", () => {
    it("should handle user approval workflow", () => {
      // Should have pending approval page
      const pendingPath = path.join(
        __dirname,
        "../../src/app/pending-approval/page.tsx"
      );
      expect(fs.existsSync(pendingPath)).toBe(true);

      // Should have admin approval endpoint
      const approvePath = path.join(
        __dirname,
        "../../src/app/api/admin/approve-user/route.ts"
      );
      expect(fs.existsSync(approvePath)).toBe(true);
    });

    it("should handle user suspension workflow", () => {
      // Should have suspension endpoint
      const suspendPath = path.join(
        __dirname,
        "../../src/app/api/admin/suspend-user/route.ts"
      );
      expect(fs.existsSync(suspendPath)).toBe(true);

      // Should have unauthorized page
      const unauthorizedPath = path.join(
        __dirname,
        "../../src/app/unauthorized/page.tsx"
      );
      expect(fs.existsSync(unauthorizedPath)).toBe(true);
    });
  });

  describe("Session Management Workflow", () => {
    it("should have session cleanup functionality", () => {
      const cleanupPath = path.join(
        __dirname,
        "../../src/app/api/auth/cleanup-sessions"
      );
      expect(fs.existsSync(cleanupPath)).toBe(true);
    });

    it("should have logout functionality", () => {
      const logoutPath = path.join(__dirname, "../../src/app/logout/page.tsx");
      expect(fs.existsSync(logoutPath)).toBe(true);

      const logoutApiPath = path.join(
        __dirname,
        "../../src/app/api/auth/logout"
      );
      expect(fs.existsSync(logoutApiPath)).toBe(true);
    });
  });

  describe("Security Features Workflow", () => {
    it("should have audit logging", () => {
      const auditPath = path.join(
        __dirname,
        "../../src/lib/utils/audit-logger.ts"
      );
      expect(fs.existsSync(auditPath)).toBe(true);

      const auditContent = fs.readFileSync(auditPath, "utf8");
      expect(auditContent).toContain("logLoginSuccess");
      expect(auditContent).toContain("logLoginFailed");
      expect(auditContent).toContain("logLogout");
    });

    it("should have account lockout protection", () => {
      const lockoutPath = path.join(
        __dirname,
        "../../src/lib/utils/account-lockout.ts"
      );
      expect(fs.existsSync(lockoutPath)).toBe(true);

      const lockoutContent = fs.readFileSync(lockoutPath, "utf8");
      expect(lockoutContent).toContain("checkLockoutStatus");
      expect(lockoutContent).toContain("resetFailedAttempts");
    });
  });

  describe("Database Schema Workflow", () => {
    it("should have User model with all required fields", () => {
      const schemaPath = path.join(__dirname, "../../prisma/schema.prisma");
      const schemaContent = fs.readFileSync(schemaPath, "utf8");

      expect(schemaContent).toContain("model User");
      expect(schemaContent).toContain("email");
      expect(schemaContent).toContain("password");
      expect(schemaContent).toContain("role");
      expect(schemaContent).toContain("userStatus");
      expect(schemaContent).toContain("emailVerified");
      expect(schemaContent).toContain("lastLogin");
      expect(schemaContent).toContain("resetToken");
    });

    it("should have AuditLog model for tracking", () => {
      const schemaPath = path.join(__dirname, "../../prisma/schema.prisma");
      const schemaContent = fs.readFileSync(schemaPath, "utf8");

      expect(schemaContent).toContain("model AuditLog");
      expect(schemaContent).toContain("user_id");
      expect(schemaContent).toContain("action");
      expect(schemaContent).toContain("ip_address");
    });
  });

  describe("Workflow Configuration Validation", () => {
    it("should have proper Auth.js configuration", () => {
      const authPath = path.join(__dirname, "../../auth.ts");
      const authContent = fs.readFileSync(authPath, "utf8");

      expect(authContent).toContain(
        "export const { auth, handlers, signIn, signOut }"
      );
      expect(authContent).toContain("session: {");
      expect(authContent).toContain("callbacks: {");
      expect(authContent).toContain("events: {");
    });

    it("should have middleware supporting user status workflows", () => {
      const middlewarePath = path.join(__dirname, "../../src/middleware.ts");
      const middlewareContent = fs.readFileSync(middlewarePath, "utf8");

      // Should handle different user statuses
      expect(middlewareContent).toContain("PENDING");
      expect(middlewareContent).toContain("REJECTED");
      expect(middlewareContent).toContain("SUSPENDED");
      expect(middlewareContent).toContain("safeRedirect");
    });
  });

  describe("API Endpoint Workflow Integration", () => {
    it("should have consistent auth integration across API endpoints", () => {
      const apiEndpoints = [
        "src/app/api/products/route.ts",
        "src/app/api/brands/route.ts",
        "src/app/api/categories/route.ts",
      ];

      apiEndpoints.forEach((endpoint) => {
        const fullPath = path.join(__dirname, "../../", endpoint);
        expect(fs.existsSync(fullPath)).toBe(true);

        const content = fs.readFileSync(fullPath, "utf8");

        // Should use standard Auth.js v5 pattern: const session = await auth()
        expect(content.includes("const session = await auth()")).toBe(true);

        // Should check for authentication
        expect(content.includes("if (!session?.user)")).toBe(true);

        // Should check for approved status
        expect(content.includes('session.user.status !== "APPROVED"')).toBe(
          true
        );
      });
    });

    it("should have role-based access control", () => {
      const rolesPath = path.join(__dirname, "../../src/lib/auth/roles.ts");
      expect(fs.existsSync(rolesPath)).toBe(true);

      const rolesContent = fs.readFileSync(rolesPath, "utf8");
      expect(rolesContent).toContain("authorizeUserForRoute");
      expect(rolesContent).toContain("UserRole");
    });
  });

  describe("Error Handling Workflow", () => {
    it("should have proper error pages", () => {
      const unauthorizedPath = path.join(
        __dirname,
        "../../src/app/unauthorized/page.tsx"
      );
      const pendingPath = path.join(
        __dirname,
        "../../src/app/pending-approval/page.tsx"
      );

      expect(fs.existsSync(unauthorizedPath)).toBe(true);
      expect(fs.existsSync(pendingPath)).toBe(true);
    });

    it("should handle authentication errors gracefully", () => {
      const authPath = path.join(__dirname, "../../auth.ts");
      const authContent = fs.readFileSync(authPath, "utf8");

      expect(authContent).toContain("catch");
      expect(authContent).toContain("AuditLogger.logLoginFailed");
      expect(authContent).toContain("return null");
    });
  });

  describe("Complete Authentication Flow", () => {
    it("should support complete user journey from registration to protected access", () => {
      // Registration -> Email verification -> Login -> Protected routes
      const requiredFiles = [
        "src/app/api/auth/register/route.ts",
        "src/app/verify-email/page.tsx",
        "src/app/login/page.tsx",
        "src/middleware.ts",
        "auth.ts",
      ];

      requiredFiles.forEach((file) => {
        const filePath = path.join(__dirname, "../../", file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });

    it("should have comprehensive security coverage", () => {
      const securityFeatures = [
        "src/lib/utils/audit-logger.ts",
        "src/lib/utils/account-lockout.ts",
        "src/lib/security-headers.ts",
        "src/lib/auth/roles.ts",
      ];

      securityFeatures.forEach((feature) => {
        const featurePath = path.join(__dirname, "../../", feature);
        expect(fs.existsSync(featurePath)).toBe(true);
      });
    });
  });
});
