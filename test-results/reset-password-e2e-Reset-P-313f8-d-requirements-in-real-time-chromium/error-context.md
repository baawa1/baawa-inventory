# Page snapshot

```yaml
- text: Set New Password Enter your new password below New Password
- textbox "New Password": StrongPass123
- paragraph: Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$!%*?&)
- text: Confirm Password
- textbox "Confirm Password"
- button "Reset Password"
- link "Back to Login":
  - /url: /login
- region "Notifications alt+T"
- button "Open Tanstack query devtools":
  - img
- alert
- button "Open Next.js Dev Tools":
  - img
```