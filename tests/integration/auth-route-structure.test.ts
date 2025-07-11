/**
 * Integration Tests for Auth Route Structure
 * Tests that auth routes are properly configured without complex mocking
 */

import { describe, it, expect } from "@jest/globals";
import path from "path";
import fs from "fs";

describe("Auth Route Structure Integration", () => {
  describe("File Structure Validation", () => {
    it("should have auth.ts in project root", () => {
      const authPath = path.join(__dirname, "../../auth.ts");
      expect(fs.existsSync(authPath)).toBe(true);
    });

    it("should have NextAuth API route", () => {
      const apiRoutePath = path.join(
        __dirname,
        "../../src/app/api/auth/[...nextauth]/route.ts"
      );
      expect(fs.existsSync(apiRoutePath)).toBe(true);
    });

    it("should have middleware.ts", () => {
      const middlewarePath = path.join(__dirname, "../../src/middleware.ts");
      expect(fs.existsSync(middlewarePath)).toBe(true);
    });
  });

  describe("Auth Configuration Structure", () => {
    it("should export auth and handlers from auth.ts", () => {
      const authPath = path.join(__dirname, "../../auth.ts");
      const authContent = fs.readFileSync(authPath, "utf8");

      // Should export auth, handlers, signIn, signOut
      expect(authContent).toContain(
        "export const { auth, handlers, signIn, signOut }"
      );
      expect(authContent).toContain("NextAuth");
      expect(authContent).toContain("CredentialsProvider");
    });

    it("should have proper API route setup", () => {
      const routePath = path.join(
        __dirname,
        "../../src/app/api/auth/[...nextauth]/route.ts"
      );
      const routeContent = fs.readFileSync(routePath, "utf8");

      // Should import handlers and export GET/POST
      expect(routeContent).toContain("import { handlers }");
      expect(routeContent).toContain("export const { GET, POST } = handlers");
    });

    it("should have middleware using auth function", () => {
      const middlewarePath = path.join(__dirname, "../../src/middleware.ts");
      const middlewareContent = fs.readFileSync(middlewarePath, "utf8");

      // Should import and use auth function
      expect(middlewareContent).toContain("import { auth }");
      expect(middlewareContent).toContain("export default auth(");
    });
  });

  describe("Custom Auth API Routes", () => {
    const customAuthRoutes = [
      "/api/auth/register",
      "/api/auth/forgot-password",
      "/api/auth/reset-password",
      "/api/auth/validate-reset-token",
    ];

    customAuthRoutes.forEach((route) => {
      it(`should have ${route} route file`, () => {
        const routePath = path.join(
          __dirname,
          "../../src/app" + route + "/route.ts"
        );
        expect(fs.existsSync(routePath)).toBe(true);
      });
    });
  });

  describe("Protected API Routes", () => {
    const protectedRoutes = [
      "/api/brands",
      "/api/categories",
      "/api/products",
      "/api/suppliers",
      "/api/users",
    ];

    protectedRoutes.forEach((route) => {
      it(`should have ${route} route file`, () => {
        const routePath = path.join(
          __dirname,
          "../../src/app" + route + "/route.ts"
        );
        expect(fs.existsSync(routePath)).toBe(true);
      });

      it(`should use auth middleware in ${route}`, () => {
        const routePath = path.join(
          __dirname,
          "../../src/app" + route + "/route.ts"
        );
        const routeContent = fs.readFileSync(routePath, "utf8");

        // Should use auth function or withPermission/withAuth middleware
        expect(
          routeContent.includes("import { auth }") ||
            routeContent.includes("withPermission") ||
            routeContent.includes("withAuth") ||
            routeContent.includes("AuthenticatedRequest")
        ).toBe(true);
      });
    });
  });

  describe("Auth Utility Files", () => {
    const authUtilityFiles = [
      "src/lib/auth/roles.ts",
      "src/lib/utils/audit-logger.ts",
      "src/lib/utils/account-lockout.ts",
      "src/lib/security-headers.ts",
    ];

    authUtilityFiles.forEach((file) => {
      it(`should have ${file}`, () => {
        const filePath = path.join(__dirname, "../../", file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe("Auth Types", () => {
    it("should have user types defined", () => {
      const typesPath = path.join(__dirname, "../../src/types/user.ts");
      expect(fs.existsSync(typesPath)).toBe(true);

      const typesContent = fs.readFileSync(typesPath, "utf8");
      expect(typesContent).toContain("UserRole");
      expect(typesContent).toContain("UserStatus");
    });
  });

  describe("Database Schema", () => {
    it("should have User model in Prisma schema", () => {
      const schemaPath = path.join(__dirname, "../../prisma/schema.prisma");
      expect(fs.existsSync(schemaPath)).toBe(true);

      const schemaContent = fs.readFileSync(schemaPath, "utf8");
      expect(schemaContent).toContain("model User");
      expect(schemaContent).toContain("email");
      expect(schemaContent).toContain("password");
      expect(schemaContent).toContain("role");
      expect(schemaContent).toContain("userStatus");
    });

    it("should have password reset functionality in User model", () => {
      const schemaPath = path.join(__dirname, "../../prisma/schema.prisma");
      const schemaContent = fs.readFileSync(schemaPath, "utf8");

      // Password reset is integrated into User model
      expect(schemaContent).toContain("resetToken");
      expect(schemaContent).toContain("resetTokenExpires");
    });

    it("should have audit logging model", () => {
      const schemaPath = path.join(__dirname, "../../prisma/schema.prisma");
      const schemaContent = fs.readFileSync(schemaPath, "utf8");

      // Should have audit log model (case insensitive)
      expect(schemaContent.toLowerCase()).toContain("auditlog");
    });
  });

  describe("Environment Configuration", () => {
    it("should have NextAuth configuration", () => {
      const envPath = path.join(__dirname, "../../.env");
      const envExamplePath = path.join(__dirname, "../../.env.example");

      // Should have at least .env.example
      expect(fs.existsSync(envExamplePath) || fs.existsSync(envPath)).toBe(
        true
      );
    });
  });

  describe("Route Pattern Validation", () => {
    it("should follow Next.js App Router conventions", () => {
      const appDir = path.join(__dirname, "../../src/app");
      expect(fs.existsSync(appDir)).toBe(true);

      // Should have api directory
      const apiDir = path.join(appDir, "api");
      expect(fs.existsSync(apiDir)).toBe(true);

      // Should have auth directory
      const authDir = path.join(apiDir, "auth");
      expect(fs.existsSync(authDir)).toBe(true);
    });

    it("should have proper route.ts files", () => {
      const routePaths = [
        "src/app/api/auth/[...nextauth]/route.ts",
        "src/app/api/auth/register/route.ts",
      ];

      routePaths.forEach((routePath) => {
        const fullPath = path.join(__dirname, "../../", routePath);
        expect(fs.existsSync(fullPath)).toBe(true);

        const content = fs.readFileSync(fullPath, "utf8");

        // Should export at least one HTTP method or use middleware
        expect(
          content.includes("export async function GET") ||
            content.includes("export async function POST") ||
            content.includes("export const GET") ||
            content.includes("export const POST") ||
            content.includes("withPermission") ||
            content.includes("withAuth") ||
            content.includes("export const { GET, POST }")
        ).toBe(true);
      });
    });
  });
});
