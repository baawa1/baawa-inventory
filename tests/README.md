# Test Suite Organization

This document outlines the organized test structure for the inventory POS system.

## Test Structure Overview

```
tests/
├── README.md                    # This file
├── setup.ts                     # Jest setup configuration
├── auth-v5-simple.test.ts       # Basic auth structure validation
├── auth-v5-setup.test.ts        # Auth setup validation
├── auth-v5-comprehensive.test.ts # Comprehensive auth testing
├── api/                         # API endpoint tests (excluded from Jest)
│   └── reset-password.test.ts   # Password reset API tests
├── components/                  # React component tests
│   └── auth/
│       ├── LoginForm.test.tsx
│       ├── RegisterForm.test.tsx
│       ├── ForgotPasswordForm.test.tsx
│       └── ResetPasswordForm.test.tsx
├── e2e/                         # End-to-end tests (Playwright)
│   ├── test-utils.ts            # E2E test utilities
│   ├── test-auth-helper.ts      # Auth helper for E2E tests
│   ├── email-test-utils.ts      # Email testing utilities
│   ├── db-test-helper.ts        # Database helper for E2E tests
│   ├── corrected-auth-flow.spec.ts      # Main auth flow tests
│   ├── verified-unapproved-users.spec.ts # Access control tests
│   ├── unverified-email-access-control.spec.ts # Email verification tests
│   ├── dashboard-access-control.spec.ts # Dashboard access tests
│   ├── reset-password-e2e.spec.ts # Password reset E2E tests
│   └── run-access-control-tests.sh # Test runner script
├── integration/                 # Integration tests
│   └── pos-access-control.test.ts # POS access control tests
└── security/                    # Security-focused tests
    └── auth-security.test.ts    # Comprehensive security testing
```

## Test Categories

### 1. Unit Tests (Jest)

- **Purpose**: Test individual functions, components, and modules in isolation
- **Framework**: Jest + React Testing Library
- **Location**: `tests/` (root level), `tests/components/`
- **Run with**: `npm test` or `npm run test:unit`

#### Auth Structure Tests

- `auth-v5-simple.test.ts` - Validates basic auth.js v5 structure
- `auth-v5-setup.test.ts` - Validates auth setup and configuration
- `auth-v5-comprehensive.test.ts` - Comprehensive auth functionality testing

#### Component Tests

- `LoginForm.test.tsx` - Login form component testing
- `RegisterForm.test.tsx` - Registration form component testing
- `ForgotPasswordForm.test.tsx` - Password reset form testing
- `ResetPasswordForm.test.tsx` - Password reset confirmation testing

### 2. API Tests (Jest - Separate)

- **Purpose**: Test API endpoints and server-side logic
- **Framework**: Jest with NextRequest mocking
- **Location**: `tests/api/`
- **Run with**: `npm run test:api`
- **Note**: Excluded from main Jest suite due to server-side dependencies

#### API Endpoint Tests

- `reset-password.test.ts` - Password reset API endpoint testing

### 3. Integration Tests (Jest)

- **Purpose**: Test interactions between multiple components/modules
- **Framework**: Jest
- **Location**: `tests/integration/`
- **Run with**: `npm test` (included in main suite)

#### Integration Tests

- `pos-access-control.test.ts` - POS system access control integration

### 4. E2E Tests (Playwright)

- **Purpose**: Test complete user workflows and real browser interactions
- **Framework**: Playwright
- **Location**: `tests/e2e/`
- **Run with**: `npm run test:e2e`

#### E2E Test Categories

- **Auth Flow Tests**: `corrected-auth-flow.spec.ts` - Complete authentication workflow
- **Access Control Tests**:
  - `verified-unapproved-users.spec.ts` - Verified but unapproved user access
  - `unverified-email-access-control.spec.ts` - Unverified email user access
  - `dashboard-access-control.spec.ts` - Dashboard access control
- **Password Reset Tests**: `reset-password-e2e.spec.ts` - Password reset workflow

### 5. Security Tests (Jest)

- **Purpose**: Test security features, vulnerabilities, and best practices
- **Framework**: Jest
- **Location**: `tests/security/`
- **Run with**: `npm test` (included in main suite)

#### Security Tests

- `auth-security.test.ts` - Comprehensive security testing including:
  - Password security
  - Account lockout protection
  - Rate limiting
  - Session security
  - Input validation
  - SQL injection prevention
  - XSS prevention
  - CSRF protection

## Test Utilities

### E2E Utilities

- `test-utils.ts` - Common E2E test utilities
- `test-auth-helper.ts` - Authentication helper for E2E tests
- `email-test-utils.ts` - Email testing utilities
- `db-test-helper.ts` - Database helper for E2E tests

## Running Tests

### All Tests

```bash
npm test          # Run Jest tests (unit, integration, security)
npm run test:e2e  # Run E2E tests
npm run test:api  # Run API tests
```

### Specific Test Categories

```bash
npm run test:unit     # Unit tests only
npm run test:watch    # Watch mode for development
npm run test:coverage # Run with coverage report
```

### E2E Test Scripts

```bash
npm run test:e2e:auth        # Auth flow tests only
npm run test:e2e:access      # Access control tests only
npm run test:e2e:password    # Password reset tests only
```

## Test Data Management

- E2E tests use unique email addresses generated by `email-test-utils.ts`
- Test data is cleaned up automatically after each test
- Database state is reset between test runs
- No test data persists between test sessions

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Unique Data**: Use unique identifiers (emails, IDs) for each test
3. **Cleanup**: Always clean up test data after tests complete
4. **Descriptive Names**: Use clear, descriptive test names that explain the scenario
5. **Error Handling**: Test both success and failure scenarios
6. **Security Focus**: Always test security implications of new features

## Coverage Requirements

- **Unit Tests**: 80% coverage minimum
- **Integration Tests**: Critical user flows covered
- **E2E Tests**: All major user journeys covered
- **Security Tests**: All security features tested

## Maintenance

- Review and update tests when adding new features
- Remove obsolete tests when features are deprecated
- Keep test utilities up to date with application changes
- Monitor test performance and optimize slow tests
