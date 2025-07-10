# E2E Testing with Playwright

This directory contains comprehensive end-to-end tests for the authentication system using Playwright.

## Test Structure

### 1. Basic Tests (`basic.spec.ts`)

- **Purpose**: Basic page load and navigation tests
- **Coverage**:
  - Home page loads correctly
  - Login page loads with proper form
  - Register page loads with proper form
  - Navigation between pages works

### 2. Authentication Tests (`auth-e2e.spec.ts`)

- **Purpose**: Core authentication functionality tests
- **Coverage**:
  - User registration form validation
  - Login form validation and error handling
  - Password reset flow with token validation
  - RBAC access control enforcement

### 3. Complete Workflow Tests (`auth-workflow.spec.ts`)

- **Purpose**: Comprehensive authentication workflow testing
- **Coverage**:
  - Complete registration workflow with email verification
  - Full login workflow with success/failure scenarios
  - Password reset workflow with token validation
  - Email verification and pending approval flows
  - Admin authentication and access control
  - Session management
  - Form validation and UX testing

## Test Data Setup

### Test Data Utility (`test-data-setup.ts`)

Provides utilities for creating test users and managing test data:

```typescript
import TestDataSetup from "./test-data-setup";

// Create test users
await TestDataSetup.setupAllTestUsers();

// Create specific test user
await TestDataSetup.createTestUser({
  email: "test@example.com",
  password: "SecurePassword123!",
  firstName: "Test",
  lastName: "User",
  role: "STAFF",
  status: "APPROVED",
  emailVerified: true,
});

// Clean up test data
await TestDataSetup.cleanupTestData();
```

### Predefined Test Users

The test data setup includes predefined users for different scenarios:

- **Admin User**: `admin@test.com` - Full admin access
- **Manager User**: `manager@test.com` - Manager level access
- **Employee User**: `employee@test.com` - Basic employee access
- **Pending User**: `pending@test.com` - Pending approval status
- **Suspended User**: `suspended@test.com` - Suspended account

## Running Tests

### Basic Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test suites
npm run test:e2e:auth        # Authentication tests only
npm run test:e2e:workflow    # Complete workflow tests
npm run test:e2e:basic       # Basic page load tests

# Run with UI for debugging
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug
```

### Advanced Commands

```bash
# Run all E2E tests in directory
npm run test:e2e:all

# Show test report
npm run test:e2e:report

# Install Playwright browsers
npm run test:e2e:install

# Generate test code
npm run test:e2e:codegen
```

## Test Scenarios Covered

### Registration Flow

- ✅ Form display and field validation
- ✅ Required field validation
- ✅ Password strength requirements
- ✅ Email format validation
- ✅ Duplicate email handling
- ✅ Successful registration redirect

### Login Flow

- ✅ Form display and validation
- ✅ Invalid credentials handling
- ✅ Account lockout after multiple failures
- ✅ Suspended account handling
- ✅ Successful login redirect

### Password Reset Flow

- ✅ Forgot password form
- ✅ Reset token validation
- ✅ Password confirmation matching
- ✅ Successful password reset

### Email Verification

- ✅ Email verification page
- ✅ Pending approval page
- ✅ Verification status handling

### Access Control

- ✅ Admin-only route protection
- ✅ Role-based access control
- ✅ Unauthorized access handling
- ✅ Session management

### Form Validation & UX

- ✅ Loading states
- ✅ Error message display
- ✅ Form field validation
- ✅ Network error handling

## Test Data Management

### Before Running Tests

1. Ensure the database is properly set up
2. Run database migrations: `npx prisma migrate dev`
3. Set up test environment variables

### Test Data Cleanup

Tests automatically clean up test data, but you can manually clean up:

```bash
# Clean up test users and audit logs
node -e "require('./tests/e2e/test-data-setup').default.cleanupTestData()"
```

## Debugging Tests

### View Test Reports

```bash
npm run test:e2e:report
```

This opens a detailed HTML report with:

- Test results and status
- Screenshots of failures
- Step-by-step execution logs
- Error details and stack traces

### Debug Mode

```bash
npm run test:e2e:debug
```

This runs tests in debug mode with:

- Browser window visible
- Step-by-step execution
- Ability to pause and inspect

### Code Generation

```bash
npm run test:e2e:codegen
```

This opens Playwright's code generator to help create new tests by recording actions.

## Best Practices

### Writing New Tests

1. Use descriptive test names that explain the scenario
2. Group related tests using `test.describe()`
3. Use `data-testid` attributes for reliable element selection
4. Test both success and failure scenarios
5. Include proper cleanup in test setup/teardown

### Test Data

1. Use unique email addresses for each test
2. Clean up test data after tests
3. Use predefined test user roles and statuses
4. Avoid hardcoded credentials in tests

### Element Selection

1. Prefer `data-testid` over CSS selectors
2. Use semantic selectors when possible
3. Avoid brittle selectors that depend on text content
4. Use page object patterns for complex pages

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Check if the development server is running
   - Verify database connection
   - Check for console errors

2. **Element not found**
   - Verify `data-testid` attributes are present
   - Check if the element is visible/rendered
   - Ensure proper waiting for async operations

3. **Database errors**
   - Run database migrations
   - Check environment variables
   - Verify Prisma schema is up to date

4. **Authentication issues**
   - Check NextAuth configuration
   - Verify session provider setup
   - Check for CSRF token issues

### Getting Help

- Check the Playwright documentation: https://playwright.dev/
- Review test reports for detailed error information
- Use debug mode to step through failing tests
- Check browser console for JavaScript errors

## Continuous Integration

### GitHub Actions

The E2E tests can be integrated into CI/CD pipelines:

```yaml
- name: Run E2E Tests
  run: |
    npm run test:e2e:install
    npm run test:e2e
```

### Test Reports

- Test results are automatically generated
- Screenshots are captured on failures
- Reports can be uploaded as artifacts

## Performance Considerations

### Test Execution

- Tests run in parallel by default
- Use `--workers=1` for debugging
- Consider test isolation for complex scenarios

### Database Performance

- Use test database for E2E tests
- Clean up test data regularly
- Consider database seeding for faster setup

### Browser Performance

- Use headless mode for CI
- Limit concurrent browser instances
- Monitor memory usage for long test suites
