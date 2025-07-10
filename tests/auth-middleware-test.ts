import { describe, it, expect, beforeEach } from "@jest/globals";
import { auth, handlers } from "../auth";

// Mock the dependencies
jest.mock("../../src/lib/db", () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../../src/lib/utils/account-lockout", () => ({
  AccountLockout: {
    checkLockoutStatus: jest.fn(),
    resetFailedAttempts: jest.fn(),
    getLockoutMessage: jest.fn(),
  },
}));

jest.mock("../../src/lib/utils/audit-logger", () => ({
  AuditLogger: {
    logLoginFailed: jest.fn(),
    logLoginSuccess: jest.fn(),
    logLogout: jest.fn(),
  },
}));

describe("Auth.js v5 Middleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("auth function", () => {
    it("should export auth function", () => {
      expect(auth).toBeDefined();
      expect(typeof auth).toBe("function");
    });

    it("should export handlers", () => {
      expect(handlers).toBeDefined();
      expect(handlers.GET).toBeDefined();
      expect(handlers.POST).toBeDefined();
    });
  });

  describe("handlers", () => {
    it("should have GET handler for session", () => {
      expect(handlers.GET).toBeDefined();
    });

    it("should have POST handler for signin", () => {
      expect(handlers.POST).toBeDefined();
    });
  });
});
