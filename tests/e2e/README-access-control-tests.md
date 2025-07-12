# Access Control Test Suite

## 🎯 Overview

This test suite covers the next phase of authentication and authorization testing, focusing on:

1. **Verified but Unapproved Users** - Testing users who have verified their email but await admin approval
2. **Dashboard Access Control** - Testing role-based access control for different user roles

## 📋 Test Coverage

### 1. Verified Unapproved Users (`verified-unapproved-users.spec.ts`)

#### User Registration and Email Verification Flow

- ✅ User registration with email verification
- ✅ Email verification process
- ✅ Status transition to VERIFIED but not APPROVED
- ✅ Proper redirection to pending-approval page

#### Access Control for Verified Unapproved Users

- ✅ Block access to dashboard
- ✅ Block access to POS system
- ✅ Block access to inventory management
- ✅ Block access to admin panel
- ✅ Block access to all inventory sub-routes
- ✅ Block access to POS history
- ✅ Block access to audit logs

#### Public Route Access

- ✅ Allow access to public routes (/, /login, /register, etc.)
- ✅ Allow access to logout functionality

#### Pending Approval Page Content

- ✅ Display correct status messages
- ✅ Show appropriate user information
- ✅ Provide logout functionality

#### Session Management

- ✅ Maintain session but redirect to pending-approval
- ✅ Handle session expiration gracefully

#### Admin Approval Process

- ✅ Admin can view pending users
- ✅ Admin can approve verified users
- ✅ User status updates after approval
- ✅ Approved users can access protected routes

#### Error Handling and Edge Cases

- ✅ Handle invalid user status
- ✅ Handle missing user status
- ✅ Handle rejected user status
- ✅ Handle suspended user status

### 2. Dashboard Access Control (`dashboard-access-control.spec.ts`)

#### Admin Access Control

- ✅ Access to all dashboard sections
- ✅ Access to user management
- ✅ Access to audit logs
- ✅ Access to all inventory features

#### Manager Access Control

- ✅ Access to appropriate dashboard sections
- ✅ Block access to admin panel
- ✅ Block access to audit logs
- ✅ Access to inventory management
- ✅ Access to POS system

#### Staff Access Control

- ✅ Access to basic dashboard sections
- ✅ Block access to admin panel
- ✅ Block access to audit logs
- ✅ Block access to advanced inventory features
- ✅ View products but not manage categories/brands
- ✅ Access to POS system

#### Unapproved User Access Control

- ✅ Block access to all dashboard sections
- ✅ Redirect to pending-approval page

#### Navigation and Sidebar Access

- ✅ Show appropriate navigation items for admin
- ✅ Show appropriate navigation items for manager
- ✅ Show appropriate navigation items for staff

#### Session Management and Access Control

- ✅ Maintain access control after page refresh
- ✅ Handle session expiration gracefully

#### Error Handling and Edge Cases

- ✅ Handle invalid role
- ✅ Handle missing role
- ✅ Handle rejected user status
- ✅ Handle suspended user status

## 🚀 Running the Tests

### Prerequisites

1. **Development Server**: Ensure your development server is running on port 3000

   ```bash
   npm run dev
   ```

2. **Database**: Ensure your database is accessible and contains test data

3. **Test Data Page**: Ensure `/test-data` page is functional for test setup

### Quick Start

Run the complete test suite with the automated script:

```bash
./tests/e2e/run-access-control-tests.sh
```

### Manual Test Execution

Run individual test files:

```bash
# Verified Unapproved Users Tests
npx playwright test tests/e2e/verified-unapproved-users.spec.ts --project=chromium

# Dashboard Access Control Tests
npx playwright test tests/e2e/dashboard-access-control.spec.ts --project=chromium
```

### Test Reports

The test runner generates comprehensive HTML reports in:

```
test-results/access-control/
```

## 🔧 Test Configuration

### Test Data Setup

Tests use the `/test-data` page to set up user sessions with specific:

- Email addresses
- User statuses (PENDING, VERIFIED, APPROVED, REJECTED, SUSPENDED)
- User roles (ADMIN, MANAGER, STAFF)

### Email Generation

Tests use the `emailUtils.generateTestEmail()` function to create unique test email addresses with patterns:

- `baawapay+verified-unapproved-*@gmail.com`
- `baawapay+admin-*@gmail.com`
- `baawapay+manager-*@gmail.com`
- `baawapay+staff-*@gmail.com`

### Test Cleanup

The test runner automatically cleans up test accounts before and after testing using:

```bash
node scripts/cleanup-test-accounts.js --all
```

## 📊 Expected Test Results

### Successful Test Run

When all tests pass, you should see:

```
🎉 All Access Control Tests Passed!

Next Steps:
1. Review the test report in test-results/access-control/
2. Clean up test accounts: node scripts/cleanup-test-accounts.js
3. Proceed to the next testing phase
```

### Test Coverage Summary

- **Total Test Cases**: 50+ comprehensive test scenarios
- **User Statuses Tested**: PENDING, VERIFIED, APPROVED, REJECTED, SUSPENDED
- **User Roles Tested**: ADMIN, MANAGER, STAFF
- **Routes Tested**: All dashboard routes, public routes, and error pages
- **Edge Cases**: Invalid statuses, missing data, session expiration

## 🐛 Troubleshooting

### Common Issues

1. **Development Server Not Running**

   ```
   [WARNING] Development server not detected on port 3000
   ```

   **Solution**: Start the development server with `npm run dev`

2. **Test Data Page Not Accessible**

   ```
   Error: Failed to load /test-data
   ```

   **Solution**: Ensure the test-data page is implemented and accessible

3. **Database Connection Issues**

   ```
   Error: Database connection failed
   ```

   **Solution**: Check database connectivity and environment variables

4. **Test Account Cleanup Failed**
   ```
   [WARNING] Failed to clean up test accounts
   ```
   **Solution**: Run cleanup manually: `node scripts/cleanup-test-accounts.js --all`

### Debug Mode

Run tests with debug output:

```bash
DEBUG=pw:api npx playwright test tests/e2e/verified-unapproved-users.spec.ts
```

### Manual Verification

After running tests, verify the results:

1. Check test reports in `test-results/access-control/`
2. Verify no test accounts remain in database
3. Confirm all routes are accessible with proper permissions

## 🔄 Integration with Existing Tests

This test suite builds upon the existing unverified email tests and provides:

1. **Complete User Lifecycle Testing**: From registration to approval
2. **Role-Based Access Control**: Comprehensive testing of all user roles
3. **Status-Based Access Control**: Testing all user statuses
4. **Error Handling**: Robust testing of edge cases and error scenarios

## 📈 Next Steps

After completing this test suite, consider:

1. **API Integration Tests**: Test the backend API endpoints
2. **Performance Testing**: Load testing for concurrent users
3. **Security Testing**: Penetration testing and vulnerability assessment
4. **User Experience Testing**: Usability testing with real users

## 📝 Notes

- Tests are designed to be idempotent and can be run multiple times
- All test accounts are automatically cleaned up after testing
- Tests use Chrome browser for consistency
- Test timeouts are set to 30 seconds for reliability
- HTML reports provide detailed failure information for debugging
