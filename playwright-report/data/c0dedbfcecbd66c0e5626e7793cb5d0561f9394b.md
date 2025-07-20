# Page snapshot

```yaml
- heading "BaaWA Inventory POS" [level=1]
- paragraph: Create your account
- heading "Create Account" [level=1]
- text: Enter your information to create your account First Name
- textbox "First Name": Verified
- text: Last Name
- textbox "Last Name": Unapproved
- text: Email
- textbox "Email": baawapays+test-verified-unapproved@gmail.com
- text: Password
- textbox "Password": TestPassword123!
- text: Password must be at least 12 characters with uppercase, lowercase, number, and special character Confirm Password
- textbox "Confirm Password": TestPassword123!
- button "Create Account"
- paragraph:
  - text: Already have an account?
  - link "Sign in":
    - /url: /login
- region "Notifications alt+T"
```