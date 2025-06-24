# 🔧 Fixing "Failed to fetch users" Error

## The Problem

The admin dashboard shows "Failed to fetch users" because the API requires authentication, but no user is logged in.

## The Solution

You need to log in as an admin user first.

### Step 1: Access the Login Page

Visit: http://localhost:3000/login

### Step 2: Use Admin Credentials

- **Email**: `admin@baawa.com`
- **Password**: Check with the system administrator or use the password set during setup

### Step 3: Verify Login

After successful login, you should be redirected to the dashboard or you can manually visit:
http://localhost:3000/admin

### Step 4: Debug (if still having issues)

Visit: http://localhost:3000/api/debug-auth to see authentication status

## Expected Behavior After Login

- ✅ Admin dashboard loads without errors
- ✅ User Management tab shows list of users
- ✅ Pending Approvals tab shows users awaiting approval
- ✅ AuthDebug component shows valid session information

## Alternative: Test in Development

If you need to test the API directly:

```bash
# This will fail (no authentication)
curl http://localhost:3000/api/users

# After logging in via browser, the browser requests will work
# because they include the session cookie
```

## Next Steps

1. Remove the AuthDebug component after confirming authentication works
2. Test user approval/rejection functionality
3. Commit the working admin dashboard implementation
