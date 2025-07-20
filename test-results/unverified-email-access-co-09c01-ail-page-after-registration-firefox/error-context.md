# Page snapshot

```yaml
- heading "BaaWA Inventory POS" [level=1]
- paragraph: Create your account
- heading "Create Account" [level=1]
- text: Enter your information to create your account First Name
- textbox "First Name": Unverified
- text: Last Name
- textbox "Last Name": User
- text: Email
- textbox "Email": baawapays+test-unverified-access@gmail.com
- text: Password
- textbox "Password": StrongPassword123!
- text: Password must be at least 12 characters with uppercase, lowercase, number, and special character Confirm Password
- textbox "Confirm Password": StrongPassword123!
- button "Creating account..." [disabled]
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
```