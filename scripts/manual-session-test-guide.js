#!/usr/bin/env node

/**
 * Manual Test Guide for Session Refresh After Email Verification
 *
 * This guide provides step-by-step instructions to manually test
 * the automatic session refresh functionality.
 */

console.log(`
🧪 MANUAL TEST GUIDE: Session Refresh After Email Verification

This test verifies that:
1. ✅ User status automatically updates after email verification
2. ✅ Pending approval page shows correct status without manual refresh
3. ✅ Session contains updated emailVerified and status fields
4. ✅ No "Account Status Unknown" messages appear

📋 STEP-BY-STEP TEST INSTRUCTIONS:

🔥 SETUP:
1. Make sure the app is running (http://localhost:3000)
2. Open browser dev tools to monitor console logs
3. Clear any existing session storage

📝 STEP 1: Register a New User
   → Go to: http://localhost:3000/register
   → Fill out the registration form:
     • First Name: Test
     • Last Name: SessionRefresh
     • Email: test-session@example.com (use a unique email)
     • Password: TestPassword123!
     • Role: STAFF
   → Click "Register"
   
   ✅ Expected Result:
   • User is created with status "PENDING"
   • Admin notification email is sent
   • User is redirected to check-email page

📧 STEP 2: Simulate Email Verification
   Since we can't easily click email links in testing, we'll simulate:
   
   → In browser dev tools console, run:
     sessionStorage.setItem("emailJustVerified", "true");
   
   → Go to: http://localhost:3000/pending-approval
   
   ✅ Expected Result:
   • Page should automatically attempt to refresh session
   • Console should show: "Auto-refreshing session due to potentially stale status"
   • If user is logged in, session.update() should be called

🔐 STEP 3: Login with the Test User
   → Go to: http://localhost:3000/login
   → Login with the test credentials
   
   ⚠️  Expected Result:
   • Login should FAIL with "Email not verified" message
   • This confirms email verification is required

🛠️  STEP 4: Manually Verify Email in Database
   Since we're testing, we need to manually update the database:
   
   Option A - Using Supabase Dashboard:
   → Go to your Supabase project dashboard
   → Navigate to Table Editor → users table
   → Find the test user by email
   → Update fields:
     • email_verified: true
     • user_status: 'VERIFIED'
     • email_verified_at: current timestamp
   
   Option B - Using SQL (if you have database access):
   → Run this SQL in Supabase SQL Editor:
     UPDATE users 
     SET email_verified = true, 
         user_status = 'VERIFIED', 
         email_verified_at = NOW()
     WHERE email = 'test-session@example.com';

🔐 STEP 5: Login After Email Verification
   → Go to: http://localhost:3000/login
   → Login with the same test credentials
   
   ✅ Expected Result:
   • Login should now SUCCEED
   • User should be redirected to pending-approval page
   • Session should contain status: "VERIFIED" and emailVerified: true

🔄 STEP 6: Test Automatic Session Refresh
   → On the pending-approval page, open dev tools console
   → Look for console messages like:
     • "Auto-refreshing session due to potentially stale status"
     • "Session refreshed successfully"
     • "JWT token refreshed from database"
   
   ✅ Expected Result:
   • Page should show "Account Pending Approval" (not "Email Verification Required")
   • Green checkmark showing "Email Verified"
   • No "Account Status Unknown" message
   • No manual refresh button needed

🎯 STEP 7: Test Status Change During Session
   → While logged in, manually change user status to "APPROVED" in database
   → On pending-approval page, in dev tools console, run:
     const { update } = require('next-auth/react').useSession();
     update(); // This would normally happen automatically
   
   ✅ Expected Result:
   • Session should update with new status
   • User should be redirected to dashboard (if status is APPROVED)

🧹 CLEANUP:
   → Delete the test user from the database after testing
   → Clear browser session storage

🎉 SUCCESS CRITERIA:
   ✅ No manual refresh required at any step
   ✅ Session automatically updates after email verification
   ✅ Pending approval page shows correct status immediately
   ✅ No "Account Status Unknown" messages
   ✅ Console logs show automatic session refresh happening
   ✅ JWT callback fetches fresh data from database when update() is called

❌ FAILURE INDICATORS:
   • "Account Status Unknown" message appears
   • Manual refresh button is needed
   • Session shows old status after database updates
   • No console logs about automatic refresh
   • User sees "Email Verification Required" after email is verified

📊 TECHNICAL VERIFICATION:
   In dev tools, check that session object contains:
   • user.status: "VERIFIED" (after email verification)
   • user.emailVerified: true (after email verification)
   • user.id: correct user ID
   • user.role: correct role

🔧 DEBUGGING:
   If automatic refresh doesn't work:
   1. Check console for errors
   2. Verify sessionStorage has "emailJustVerified" flag
   3. Check that middleware allows access to pending-approval page
   4. Verify JWT callback in auth.ts is fetching from database
   5. Check network tab for session update requests

This manual test validates the complete session refresh workflow without
requiring complex automated testing infrastructure.
`);

console.log("📝 Manual test guide displayed above ☝️");
console.log("");
console.log("🚀 To start testing, go to: http://localhost:3000/register");
console.log("");
