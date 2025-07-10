import { describe, it, expect } from "@jest/globals";

describe("Auth.js v5 Simple Tests", () => {
  describe("File Structure", () => {
    it("should have auth.ts file with correct structure", () => {
      // This test verifies that the auth.ts file exists and has the right structure
      // We'll check the file content directly
      const fs = require("fs");
      const path = require("path");

      const authFilePath = path.join(__dirname, "..", "auth.ts");
      expect(fs.existsSync(authFilePath)).toBe(true);

      const authContent = fs.readFileSync(authFilePath, "utf8");

      // Check for required imports
      expect(authContent).toContain('import NextAuth from "next-auth"');
      expect(authContent).toContain(
        'import CredentialsProvider from "next-auth/providers/credentials"'
      );

      // Check for required exports
      expect(authContent).toContain(
        "export const { auth, handlers } = NextAuth(config)"
      );

      // Check for provider configuration
      expect(authContent).toContain("CredentialsProvider({");
      expect(authContent).toContain('name: "credentials"');

      // Check for session configuration
      expect(authContent).toContain("session: {");
      expect(authContent).toContain('strategy: "jwt"');

      // Check for callbacks
      expect(authContent).toContain("callbacks: {");
      expect(authContent).toContain("async jwt({ token, user })");
      expect(authContent).toContain("async session({ session, token })");
    });

    it("should have API route with handlers", () => {
      const fs = require("fs");
      const path = require("path");

      const apiRoutePath = path.join(
        __dirname,
        "..",
        "src",
        "app",
        "api",
        "auth",
        "[...nextauth]",
        "route.ts"
      );
      expect(fs.existsSync(apiRoutePath)).toBe(true);

      const apiRouteContent = fs.readFileSync(apiRoutePath, "utf8");

      // Check for handlers import and export
      expect(apiRouteContent).toContain("import { handlers }");
      expect(apiRouteContent).toContain(
        "export const { GET, POST } = handlers"
      );
    });

    it("should have middleware using auth function", () => {
      const fs = require("fs");
      const path = require("path");

      const middlewarePath = path.join(__dirname, "..", "src", "middleware.ts");
      expect(fs.existsSync(middlewarePath)).toBe(true);

      const middlewareContent = fs.readFileSync(middlewarePath, "utf8");

      // Check for auth import and usage
      expect(middlewareContent).toContain('import { auth } from "../auth"');
      expect(middlewareContent).toContain("export default auth(");
    });
  });

  describe("Custom Middleware Cleanup", () => {
    it("should not have custom authentication middleware", () => {
      const fs = require("fs");
      const path = require("path");

      const customMiddlewareFiles = [
        path.join(__dirname, "..", "src", "lib", "api-auth-middleware.ts"),
        path.join(__dirname, "..", "src", "lib", "api-middleware.ts"),
      ];

      customMiddlewareFiles.forEach((file) => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, "utf8");

          // Should not contain custom middleware functions
          expect(content).not.toContain("withAuth(");
          expect(content).not.toContain("withValidatedAuth(");
          expect(content).not.toContain("withAuthAndRoleCheck(");
          expect(content).not.toContain("withAdminAuth(");
          expect(content).not.toContain("withManagerAuth(");
        }
      });
    });
  });

  describe("Configuration Validation", () => {
    it("should have correct NextAuth configuration", () => {
      const fs = require("fs");
      const path = require("path");

      const authFilePath = path.join(__dirname, "..", "auth.ts");
      const authContent = fs.readFileSync(authFilePath, "utf8");

      // Check for required configuration sections
      expect(authContent).toContain("providers: [");
      expect(authContent).toContain("session: {");
      expect(authContent).toContain("callbacks: {");
      expect(authContent).toContain("events: {");
      expect(authContent).toContain("pages: {");

      // Check for security configuration
      expect(authContent).toContain("secret: process.env.NEXTAUTH_SECRET");
    });

    it("should have proper error handling in authorize function", () => {
      const fs = require("fs");
      const path = require("path");

      const authFilePath = path.join(__dirname, "..", "auth.ts");
      const authContent = fs.readFileSync(authFilePath, "utf8");

      // Check for error handling in authorize function
      expect(authContent).toContain("async authorize(credentials, req)");
      expect(authContent).toContain("try {");
      expect(authContent).toContain("} catch (error) {");
      expect(authContent).toContain(
        'console.error("Authentication error:", error)'
      );
    });
  });

  describe("Security Features", () => {
    it("should have account lockout functionality", () => {
      const fs = require("fs");
      const path = require("path");

      const authFilePath = path.join(__dirname, "..", "auth.ts");
      const authContent = fs.readFileSync(authFilePath, "utf8");

      // Check for account lockout imports and usage
      expect(authContent).toContain(
        'import { AccountLockout } from "./src/lib/utils/account-lockout"'
      );
      expect(authContent).toContain("AccountLockout.checkLockoutStatus");
      expect(authContent).toContain("AccountLockout.resetFailedAttempts");
    });

    it("should have audit logging functionality", () => {
      const fs = require("fs");
      const path = require("path");

      const authFilePath = path.join(__dirname, "..", "auth.ts");
      const authContent = fs.readFileSync(authFilePath, "utf8");

      // Check for audit logging imports and usage
      expect(authContent).toContain(
        'import { AuditLogger } from "./src/lib/utils/audit-logger"'
      );
      expect(authContent).toContain("AuditLogger.logLoginFailed");
      expect(authContent).toContain("AuditLogger.logLoginSuccess");
      expect(authContent).toContain("AuditLogger.logLogout");
    });

    it("should have password hashing", () => {
      const fs = require("fs");
      const path = require("path");

      const authFilePath = path.join(__dirname, "..", "auth.ts");
      const authContent = fs.readFileSync(authFilePath, "utf8");

      // Check for bcrypt usage
      expect(authContent).toContain('import * as bcrypt from "bcryptjs"');
      expect(authContent).toContain("bcrypt.compare");
    });
  });
});
