# Page snapshot

```yaml
- text: Set New Password Enter your new password below New Password
- textbox "New Password": StrongPass123!
- text: Confirm Password
- textbox "Confirm Password": StrongPass123!
- text: NetworkError when attempting to fetch resource.
- button "Reset Password"
- link "Back to Login":
  - /url: /login
- region "Notifications alt+T"
- button "Open Tanstack query devtools":
  - img
- alert
- button "Open Next.js Dev Tools":
  - img
- button "Open issues overlay": 1 Issue
- button "Collapse issues badge":
  - img
```