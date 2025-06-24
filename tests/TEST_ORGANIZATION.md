# Test Organization

This document explains the reorganized test structure for the BaaWA Inventory POS system.

## Directory Structure

### `/tests/integration/`

Integration tests that test multiple components working together:

- **`auth/`** - Authentication flow tests (login, registration, password reset, etc.)
- **`api/`** - API endpoint integration tests
- **`email/`** - Email service and notification tests
- **`session/`** - Session management and refresh tests

### `/tests/unit/`

Unit tests for individual components:

- **`components/`** - React component tests
- **`lib/`** - Utility function and service tests
- **`middleware/`** - Middleware logic tests
- **`types/`** - Type validation tests

### `/tests/database/`

Database-specific tests:

- Connection tests
- Schema validation tests
- Data integrity tests

### `/tests/scripts/`

Test utility scripts and manual testing guides:

- User management utilities
- Session testing guides
- Data manipulation scripts

### `/tests/utils/`

Test utilities and setup:

- Test helpers
- Mock data generators
- Setup configurations

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=integration/auth
npm test -- --testPathPattern=components
npm test -- --testPathPattern=database

# Run individual test files
npm test tests/integration/auth/test-login-flow.js
```

## Migrated Files

The following files were moved from `/scripts/` to organized locations:

### Authentication Tests (23 files)

- All `test-auth-*`, `test-login-*`, `test-registration-*`, `test-password-*` files
- Moved to: `/tests/integration/auth/`

### Email Tests (7 files)

- All `test-email-*`, `test-resend-*`, `test-admin-notifications.js`
- Moved to: `/tests/integration/email/`

### Session Tests (4 files)

- All `test-session-*`, `test-refresh-*` files
- Moved to: `/tests/integration/session/`

### API Tests (2 files)

- `test-user-api.js`, `test-admin-dashboard-integration.js`
- Moved to: `/tests/integration/api/`

### Database Tests (3 files)

- `test-prisma-connection.js`, `test-direct-connection.js`
- Moved to: `/tests/database/`

### Utility Scripts (3 files)

- `manual-session-test-guide.js`, `check-users.js`, `toggle-user-status.js`
- Moved to: `/tests/scripts/`

## Remaining in `/scripts/`

Only actual utility scripts remain:

- `seed-users.ts` - Database seeding utility
- `setup-resend.sh` - Email service setup script

## Next Steps

1. Convert ad-hoc test scripts to proper Jest test suites
2. Add proper test configurations for each category
3. Implement test coverage reporting
4. Add CI/CD test automation
