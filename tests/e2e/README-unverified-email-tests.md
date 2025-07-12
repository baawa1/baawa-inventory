# Unverified Email Users Access Control Tests

## Overview

This test suite validates that unverified email users are properly restricted from accessing protected routes and are redirected to appropriate pages.

## Test Configuration

### Playwright Setup

- **Browser**: Chrome with guest profile
- **Port**: 3000 (ensured by cleanup script)
- **Guest Profile**: Uses `--guest` flag for clean testing environment

### Test Files

1. **`unverified-email-basic.spec.ts`** - Basic functionality tests
2. **`unverified-email-access-control.spec.ts`** - Comprehensive access control tests

## Test Scenarios

### ✅ Basic Functionality Tests

1. **Redirect to Login**: Unverified users accessing protected routes are redirected to `/login`
2. **Public Route Access**: Public routes (`/`, `/login`, `/register`) are accessible
3. **Registration Form**: Registration form displays correctly with all required fields
4. **Registration Flow**: Successful registration redirects to `/check-email`

### ✅ Comprehensive Access Control Tests

#### Registration and Email Verification Flow

- ✅ Redirect unverified users to verify-email page after registration
- ✅ Prevent unverified users from accessing dashboard
- ✅ Prevent unverified users from accessing POS
- ✅ Prevent unverified users from accessing inventory
- ✅ Prevent unverified users from accessing admin panel

#### Email Verification Process

- ✅ Allow access to verify-email page without authentication
- ✅ Allow access to check-email page without authentication
- ✅ Redirect to register if no email provided to check-email

#### Login Attempts with Unverified Email

- ✅ Prevent login with unverified email

#### Direct URL Access Protection

- ✅ Protect all dashboard routes from unverified users
- ✅ Allow access to public routes for unverified users

#### Session Management for Unverified Users

- ✅ No authentication session created for unverified users

## Running Tests

### Automated Script

```bash
./scripts/run-tests-clean.sh
```

This script:

1. Kills all existing dev environments
2. Ensures port 3000 is available
3. Starts the dev server on port 3000
4. Runs tests with Chrome guest profile
5. Cleans up after completion

### Manual Testing

```bash
# Start dev server
npm run dev

# Run basic tests
npx playwright test tests/e2e/unverified-email-basic.spec.ts --project=chrome

# Run comprehensive tests
npx playwright test tests/e2e/unverified-email-access-control.spec.ts --project=chrome
```

## Test Results

### Current Status

- ✅ **Basic Tests**: All passing
- ✅ **Chrome Guest Profile**: Working correctly
- ✅ **Port 3000**: Properly configured and used
- ✅ **Server Management**: Automated cleanup and startup

### Key Validations

1. **Email Verification Required**: Users cannot log in without verifying their email
2. **Protected Route Access**: All dashboard routes redirect unverified users to login
3. **Public Route Access**: Public routes remain accessible
4. **Registration Flow**: Proper redirect to email verification
5. **Session Security**: No authentication cookies for unverified users

## Configuration Files

### Playwright Config (`playwright.config.ts`)

```typescript
projects: [
  {
    name: "chrome",
    use: {
      ...devices["Desktop Chrome"],
      launchOptions: {
        args: [
          "--guest",
          "--disable-web-security",
          "--disable-features=VizDisplayCompositor",
          "--no-sandbox",
          "--disable-setuid-sandbox",
        ],
      },
    },
  },
];
```

### Test Script (`scripts/run-tests-clean.sh`)

- Automated environment cleanup
- Port management
- Server startup/shutdown
- Test execution

## Next Steps

1. **Verified but Unapproved Users** - Test users who have verified email but await admin approval
2. **Dashboard Access Control** - Test that only approved users can access dashboard pages
3. **Role-based Access Control** - Test different user roles and permissions

## Notes

- Tests use Chrome guest profile for clean, isolated testing
- Port 3000 is enforced to avoid conflicts
- All tests include proper cleanup and error handling
- Comprehensive logging for debugging and monitoring
