import { ErrorSanitizer, SanitizedError } from "@/lib/utils/error-sanitizer";

describe("ErrorSanitizer", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("sanitizeError", () => {
    it("should sanitize Error objects", () => {
      const error = new Error("Database connection failed");
      const result = ErrorSanitizer.sanitizeError(error);

      expect(result).toEqual({
        message: "Database connection failed",
        type: "Error",
        timestamp: expect.any(String),
        sanitized: true,
      });
    });

    it("should sanitize string errors", () => {
      const error = "Something went wrong";
      const result = ErrorSanitizer.sanitizeError(error);

      expect(result).toEqual({
        message: "Something went wrong",
        type: "StringError",
        timestamp: expect.any(String),
        sanitized: true,
      });
    });

    it("should sanitize object errors", () => {
      const error = { message: "Object error", code: "ERR_001" };
      const result = ErrorSanitizer.sanitizeError(error);

      expect(result).toEqual({
        message: '{"message":"Object error","code":"ERR_001"}',
        type: "ObjectError",
        timestamp: expect.any(String),
        sanitized: true,
      });
    });

    it("should handle unknown error types", () => {
      const error = null;
      const result = ErrorSanitizer.sanitizeError(error);

      expect(result).toEqual({
        message: "Unknown error occurred",
        type: "UnknownError",
        timestamp: expect.any(String),
        sanitized: true,
      });
    });

    it("should preserve error codes when available", () => {
      const error = new Error("Network error");
      (error as any).code = "NETWORK_ERROR";

      const result = ErrorSanitizer.sanitizeError(error);

      expect(result.code).toBe("NETWORK_ERROR");
    });
  });

  describe("sanitizeMessage", () => {
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

  describe("sanitizeObject", () => {
    it("should remove sensitive fields from objects", () => {
      const obj = {
        id: 1,
        email: "test@example.com",
        password: "secret123",
        token: "abc123",
        name: "John Doe",
      };

      const result = ErrorSanitizer.sanitizeError(obj);
      const parsedMessage = JSON.parse(result.message);

      expect(parsedMessage.password).toBe("[REDACTED]");
      expect(parsedMessage.token).toBe("[REDACTED]");
      expect(parsedMessage.name).toBe("John Doe");
      expect(parsedMessage.id).toBe(1);
    });

    it("should handle nested objects", () => {
      const obj = {
        user: {
          id: 1,
          password: "secret123",
          profile: {
            email: "test@example.com",
            token: "abc123",
          },
        },
      };

      const result = ErrorSanitizer.sanitizeError(obj);
      const parsedMessage = JSON.parse(result.message);

      expect(parsedMessage.user.password).toBe("[REDACTED]");
      expect(parsedMessage.user.profile.token).toBe("[REDACTED]");
      expect(parsedMessage.user.id).toBe(1);
    });

    it("should handle arrays", () => {
      const obj = {
        users: [
          { id: 1, password: "secret1" },
          { id: 2, password: "secret2" },
        ],
      };

      const result = ErrorSanitizer.sanitizeError(obj);
      const parsedMessage = JSON.parse(result.message);

      expect(parsedMessage.users[0].password).toBe("[REDACTED]");
      expect(parsedMessage.users[1].password).toBe("[REDACTED]");
      expect(parsedMessage.users[0].id).toBe(1);
    });

    it("should handle null and undefined values", () => {
      const obj = {
        id: 1,
        password: null,
        token: undefined,
        name: "John",
      };

      const result = ErrorSanitizer.sanitizeError(obj);
      const parsedMessage = JSON.parse(result.message);

      expect(parsedMessage.password).toBe("[REDACTED]");
      expect(parsedMessage.token).toBe("[REDACTED]");
      expect(parsedMessage.name).toBe("John");
    });
  });

  describe("isSensitiveField", () => {
    it("should identify sensitive field names", () => {
      const sensitiveFields = [
        "password",
        "password_hash",
        "token",
        "secret",
        "key",
        "credential",
        "authorization",
        "cookie",
        "session",
        "resetToken",
        "emailVerificationToken",
        "csrf",
        "api_key",
        "private_key",
        "access_token",
        "refresh_token",
      ];

      sensitiveFields.forEach((field) => {
        const obj = { [field]: "value" };
        const result = ErrorSanitizer.sanitizeError(obj);
        const parsedMessage = JSON.parse(result.message);
        expect(parsedMessage[field]).toBe("[REDACTED]");
      });
    });

    it("should handle case-insensitive field matching", () => {
      const obj = {
        PASSWORD: "secret123",
        Token: "abc123",
        API_KEY: "xyz789",
      };

      const result = ErrorSanitizer.sanitizeError(obj);
      const parsedMessage = JSON.parse(result.message);

      expect(parsedMessage.PASSWORD).toBe("[REDACTED]");
      expect(parsedMessage.Token).toBe("[REDACTED]");
      expect(parsedMessage.API_KEY).toBe("[REDACTED]");
    });
  });

  describe("isSensitiveValue", () => {
    it("should identify JWT tokens", () => {
      const jwtToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

      const obj = { token: jwtToken };
      const result = ErrorSanitizer.sanitizeError(obj);
      const parsedMessage = JSON.parse(result.message);

      expect(parsedMessage.token).toBe("[REDACTED]");
    });

    it("should identify long alphanumeric strings", () => {
      const longToken = "abcdef1234567890abcdef1234567890abcdef1234567890";

      const obj = { token: longToken };
      const result = ErrorSanitizer.sanitizeError(obj);
      const parsedMessage = JSON.parse(result.message);

      expect(parsedMessage.token).toBe("[REDACTED]");
    });

    it("should identify bearer tokens", () => {
      const bearerToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

      const obj = { authorization: bearerToken };
      const result = ErrorSanitizer.sanitizeError(obj);
      const parsedMessage = JSON.parse(result.message);

      expect(parsedMessage.authorization).toBe("[REDACTED]");
    });

    it("should not flag normal strings as sensitive", () => {
      const normalString = "This is a normal message";

      const obj = { message: normalString };
      const result = ErrorSanitizer.sanitizeError(obj);
      const parsedMessage = JSON.parse(result.message);

      expect(parsedMessage.message).toBe(normalString);
    });
  });

  describe("logError", () => {
    it("should log sanitized errors", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const error = new Error("Database error with password: secret123");
      ErrorSanitizer.logError(error, "Database operation");

      expect(consoleSpy).toHaveBeenCalled();
      const loggedMessage = consoleSpy.mock.calls[0][0];
      expect(loggedMessage).toContain("Database operation");
      expect(loggedMessage).not.toContain("secret123");

      consoleSpy.mockRestore();
    });

    it("should log additional data safely", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const error = new Error("Auth error");
      const additionalData = {
        user: "test@example.com",
        password: "secret123",
      };

      ErrorSanitizer.logError(error, "Authentication", additionalData);

      expect(consoleSpy).toHaveBeenCalled();
      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.user).toBe("test@example.com");
      expect(loggedData.password).toBe("[REDACTED]");

      consoleSpy.mockRestore();
    });
  });

  describe("logAuthError", () => {
    it("should log authentication errors with sanitized email", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const error = new Error("Login failed");
      ErrorSanitizer.logAuthError(error, "test@example.com");

      expect(consoleSpy).toHaveBeenCalled();
      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.email).toBe("te***@example.com");

      consoleSpy.mockRestore();
    });

    it("should handle missing email", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const error = new Error("Login failed");
      ErrorSanitizer.logAuthError(error);

      expect(consoleSpy).toHaveBeenCalled();
      const loggedData = consoleSpy.mock.calls[0][1];
      expect(loggedData.email).toBeUndefined();

      consoleSpy.mockRestore();
    });
  });

  describe("sanitizeEmail", () => {
    it("should sanitize email addresses correctly", () => {
      const testCases = [
        { input: "test@example.com", expected: "te***@example.com" },
        { input: "a@example.com", expected: "***@example.com" },
        { input: "longemail@example.com", expected: "lo***@example.com" },
        { input: "invalid-email", expected: "[INVALID_EMAIL]" },
      ];

      testCases.forEach(({ input, expected }) => {
        const obj = { email: input };
        const result = ErrorSanitizer.sanitizeError(obj);
        const parsedMessage = JSON.parse(result.message);
        expect(parsedMessage.email).toBe(expected);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle circular references", () => {
      const obj: any = { name: "test" };
      obj.self = obj;

      const result = ErrorSanitizer.sanitizeError(obj);
      expect(result.message).toContain("circular");
    });

    it("should handle very large objects", () => {
      const largeObj = {
        data: "x".repeat(10000),
        password: "secret123",
      };

      const result = ErrorSanitizer.sanitizeError(largeObj);
      expect(result.message).not.toContain("secret123");
    });

    it("should handle special characters in sensitive data", () => {
      const obj = {
        password: "secret!@#$%^&*()",
        token: "token-with-special-chars!@#",
      };

      const result = ErrorSanitizer.sanitizeError(obj);
      const parsedMessage = JSON.parse(result.message);
      expect(parsedMessage.password).toBe("[REDACTED]");
      expect(parsedMessage.token).toBe("[REDACTED]");
    });
  });
});
