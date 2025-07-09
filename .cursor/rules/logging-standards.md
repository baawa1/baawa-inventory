# Logging Standards Rule

## Purpose

To ensure consistent, structured, and secure logging across the application that provides useful debugging information without exposing sensitive data.

## Rule

- **Use the structured logger** (`src/lib/logger.ts`) for all application logging.
- **Never use console.log, console.error, etc.** directly in production code.
- **Use appropriate log levels:**
  - `logger.error()` - For errors that need immediate attention
  - `logger.warn()` - For warnings and potential issues
  - `logger.info()` - For general application flow and important events
  - `logger.debug()` - For detailed debugging information (only in development)
- **Use specialized methods for specific domains:**
  - `logger.auth()` - For authentication events
  - `logger.session()` - For session management events
  - `logger.security()` - For security-related events
- **Always provide context** as the second parameter for better debugging.
- **Sanitize sensitive data** before logging (passwords, tokens, PII).
- **Use descriptive messages** that explain what happened, not just variable values.

## Examples

**Correct:**

```ts
logger.auth("User login successful", {
  userId: user.id,
  role: user.role,
  timestamp: new Date().toISOString(),
});

logger.error("Database connection failed", {
  error: "Connection timeout",
  retryAttempt: 3,
});
```

**Incorrect:**

```ts
console.log("User logged in:", user); // ❌ Direct console usage
console.error("Error:", error); // ❌ No context, may expose sensitive data
```

## Enforcement

- All code reviews must check for proper logging usage.
- No direct console methods in production code.
- All logs must include appropriate context.
