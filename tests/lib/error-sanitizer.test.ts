import { ErrorSanitizer } from "@/lib/utils/error-sanitizer";

// Mock the logger
jest.mock("@/lib/logger", () => ({
  logger: {
    error: jest.fn(),
  },
}));

describe("ErrorSanitizer", () => {
  describe("sanitizeError", () => {
    it("should sanitize Error objects", () => {
      const error = new Error("Database connection failed");
      const result = ErrorSanitizer.sanitizeError(error);

      expect(result.message).toBe("Database connection failed");
      expect(result.type).toBe("Error");
      expect(result.timestamp).toBeDefined();
      expect(result.sanitized).toBe(true);
    });

    it("should sanitize string errors", () => {
      const error = "Authentication failed";
      const result = ErrorSanitizer.sanitizeError(error);

      expect(result.message).toBe("Authentication failed");
      expect(result.type).toBe("StringError");
      expect(result.timestamp).toBeDefined();
      expect(result.sanitized).toBe(true);
    });

    it("should sanitize object errors", () => {
      const error = { message: "Validation failed", code: "VALIDATION_ERROR" };
      const result = ErrorSanitizer.sanitizeError(error);

      expect(result.message).toContain("Validation failed");
      expect(result.type).toBe("ObjectError");
      expect(result.timestamp).toBeDefined();
      expect(result.sanitized).toBe(true);
    });

    it("should handle null/undefined errors", () => {
      const result = ErrorSanitizer.sanitizeError(null);

      expect(result.message).toBe("Unknown error occurred");
      expect(result.type).toBe("UnknownError");
      expect(result.timestamp).toBeDefined();
      expect(result.sanitized).toBe(true);
    });
  });

  describe("sanitizeMessage (via sanitizeError)", () => {
    it("should remove sensitive patterns from error messages", () => {
      const message = "Login failed with password: secret123 and token: abc123";
      const result = ErrorSanitizer.sanitizeError(message);

      expect(result.message).toContain("[REDACTED]");
      expect(result.message).not.toContain("secret123");
      expect(result.message).not.toContain("abc123");
    });

    it("should remove email addresses", () => {
      const message = "User test@example.com failed to login";
      const result = ErrorSanitizer.sanitizeError(message);

      expect(result.message).toContain("[REDACTED_EMAIL]");
      expect(result.message).not.toContain("test@example.com");
    });

    it("should remove IP addresses", () => {
      const message = "Connection from 192.168.1.100 failed";
      const result = ErrorSanitizer.sanitizeError(message);

      expect(result.message).toContain("[REDACTED_IP]");
      expect(result.message).not.toContain("192.168.1.100");
    });

    it("should remove long alphanumeric tokens", () => {
      const message =
        "Token validation failed: abcdef1234567890abcdef1234567890";
      const result = ErrorSanitizer.sanitizeError(message);

      expect(result.message).toContain("[REDACTED_TOKEN]");
      expect(result.message).not.toContain("abcdef1234567890abcdef1234567890");
    });

    it("should handle multiple sensitive patterns", () => {
      const message =
        "Auth failed for user@example.com with password secret and token abc123 from 192.168.1.1";
      const result = ErrorSanitizer.sanitizeError(message);

      expect(result.message).toContain("[REDACTED_EMAIL]");
      expect(result.message).toContain("[REDACTED]");
      expect(result.message).toContain("[REDACTED_IP]");
    });
  });

  describe("sanitizeObject (via logError)", () => {
    it("should remove sensitive fields from objects", () => {
      const { logger } = require("@/lib/logger");
      const mockLogger = logger as jest.Mocked<typeof logger>;

      const obj = {
        user: "test@example.com",
        password: "secret123",
        token: "abc123",
        data: "safe data",
      };

      ErrorSanitizer.logError(new Error("Test error"), "test", obj);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error in test",
        expect.objectContaining({
          user: "[REDACTED_EMAIL]",
          password: "[REDACTED]",
          token: "[REDACTED]",
          data: "safe data",
        })
      );
    });

    it("should handle nested objects", () => {
      const { logger } = require("@/lib/logger");
      const mockLogger = logger as jest.Mocked<typeof logger>;

      const obj = {
        user: {
          email: "test@example.com",
          password: "secret123",
        },
        config: {
          apiKey: "secret-key",
          data: "safe",
        },
      };

      ErrorSanitizer.logError(new Error("Test error"), "test", obj);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error in test",
        expect.objectContaining({
          user: {
            email: "[REDACTED_EMAIL]",
            password: "[REDACTED]",
          },
          config: {
            apiKey: "[REDACTED]",
            data: "safe",
          },
        })
      );
    });

    it("should handle arrays", () => {
      const { logger } = require("@/lib/logger");
      const mockLogger = logger as jest.Mocked<typeof logger>;

      const obj = {
        users: [
          { email: "user1@example.com", password: "pass1" },
          { email: "user2@example.com", password: "pass2" },
        ],
      };

      ErrorSanitizer.logError(new Error("Test error"), "test", obj);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error in test",
        expect.objectContaining({
          users: [
            { email: "[REDACTED_EMAIL]", password: "[REDACTED]" },
            { email: "[REDACTED_EMAIL]", password: "[REDACTED]" },
          ],
        })
      );
    });

    it("should handle sensitive values", () => {
      const { logger } = require("@/lib/logger");
      const mockLogger = logger as jest.Mocked<typeof logger>;

      const obj = {
        jwt: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c",
        bearer: "Bearer abc123def456",
        longToken: "abcdef1234567890abcdef1234567890abcdef1234567890",
      };

      ErrorSanitizer.logError(new Error("Test error"), "test", obj);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error in test",
        expect.objectContaining({
          jwt: "[REDACTED]",
          bearer: "[REDACTED]",
          longToken: "[REDACTED]",
        })
      );
    });
  });

  describe("sanitizeEmail (via logAuthError)", () => {
    it("should mask email addresses", () => {
      const { logger } = require("@/lib/logger");
      const mockLogger = logger as jest.Mocked<typeof logger>;

      const email = "test@example.com";
      ErrorSanitizer.logAuthError(new Error("Test error"), email);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Authentication error",
        expect.objectContaining({
          email: "te***@example.com",
        })
      );
    });

    it("should handle short usernames", () => {
      const { logger } = require("@/lib/logger");
      const mockLogger = logger as jest.Mocked<typeof logger>;

      const email = "a@example.com";
      ErrorSanitizer.logAuthError(new Error("Test error"), email);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Authentication error",
        expect.objectContaining({
          email: "***@example.com",
        })
      );
    });

    it("should handle invalid email format", () => {
      const { logger } = require("@/lib/logger");
      const mockLogger = logger as jest.Mocked<typeof logger>;

      const email = "invalid-email";
      ErrorSanitizer.logAuthError(new Error("Test error"), email);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Authentication error",
        expect.objectContaining({
          email: "[INVALID_EMAIL]",
        })
      );
    });
  });

  describe("logAuthError", () => {
    it("should log authentication errors safely", () => {
      const { logger } = require("@/lib/logger");
      const mockLogger = logger as jest.Mocked<typeof logger>;

      const error = new Error("Login failed");
      const email = "test@example.com";
      const additionalData = { operation: "login", ip: "192.168.1.1" };

      ErrorSanitizer.logAuthError(error, email, additionalData);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Authentication error",
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Login failed",
            sanitized: true,
          }),
          email: "te***@example.com",
          operation: "login",
          ip: "[REDACTED_IP]",
        })
      );
    });

    it("should handle errors without email", () => {
      const { logger } = require("@/lib/logger");
      const mockLogger = logger as jest.Mocked<typeof logger>;

      const error = new Error("Database error");

      ErrorSanitizer.logAuthError(error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Authentication error",
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Database error",
            sanitized: true,
          }),
        })
      );
    });
  });

  describe("logError", () => {
    it("should log general errors safely", () => {
      const { logger } = require("@/lib/logger");
      const mockLogger = logger as jest.Mocked<typeof logger>;

      const error = new Error("Operation failed");
      const context = "testOperation";
      const additionalData = { userId: 123, action: "update" };

      ErrorSanitizer.logError(error, context, additionalData);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error in testOperation",
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Operation failed",
            sanitized: true,
          }),
          userId: 123,
          action: "update",
        })
      );
    });

    it("should handle errors without context", () => {
      const { logger } = require("@/lib/logger");
      const mockLogger = logger as jest.Mocked<typeof logger>;

      const error = new Error("Generic error");

      ErrorSanitizer.logError(error);

      expect(mockLogger.error).toHaveBeenCalledWith(
        "Error occurred",
        expect.objectContaining({
          error: expect.objectContaining({
            message: "Generic error",
            sanitized: true,
          }),
        })
      );
    });
  });
});
