# Page snapshot

```yaml
- heading "BaaWA Inventory POS" [level=1]
- paragraph: Create your account to get started
- heading "Create Account" [level=1]
- text: Enter your information to create your account Passwords don't match First Name
- textbox "First Name": Existing
- text: Last Name
- textbox "Last Name": User
- text: Email
- textbox "Email": existing@example.com
- text: Password
- textbox "Password": SecurePassword123!
- text: Password must be at least 12 characters with uppercase, lowercase, number, and special character Confirm Password
- textbox "Confirm Password"
- paragraph: Passwords don't match
- button "Create Account"
- paragraph:
  - text: Already have an account?
  - link "Sign in":
    - /url: /login
- region "Notifications alt+T"
- button "Open Tanstack query devtools":
  - img
- alert
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 2 Issue
- button "Collapse issues badge":
  - img
```