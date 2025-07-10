# Page snapshot

```yaml
- heading "BaaWA Inventory POS" [level=1]
- paragraph: Accessories Inventory Management System
- text: Sign In Enter your email and password to access your account Email
- textbox "Email": test@example.com
- text: Password
- textbox "Password": password123
- button "Signing in..." [disabled]
- link "Forgot your password?":
  - /url: /forgot-password
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
- button "Open issues overlay": 2 Issue
- button "Collapse issues badge":
  - img
```