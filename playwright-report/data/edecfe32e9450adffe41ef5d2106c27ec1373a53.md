# Page snapshot

```yaml
- heading "BaaWA Inventory POS" [level=1]
- paragraph: Accessories Inventory Management System
- text: Sign in Enter your credentials to access your account
- alert: Invalid email or password. Please try again.
- text: Email
- textbox "Email": baawapay+real-flow-1752341024643-jgxujl@gmail.com
- text: Password
- textbox "Password": SecurePass123!@#
- button
- button "Sign in"
- button "Forgot your password?"
- paragraph:
  - text: Don't have an account?
  - link "Sign up":
    - /url: /register
- region "Notifications alt+T"
- button "Open Tanstack query devtools":
  - img
- alert
- button "Open Next.js Dev Tools":
  - img
```