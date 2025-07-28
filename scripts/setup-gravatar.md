# Setting Up Gravatar for Email Avatars

## Why Email Avatars Don't Show

Email clients like Gmail, Outlook, and Apple Mail primarily use:
1. **Gravatar** - A global avatar service
2. **Email service provider settings** - Like Gmail's sender profile
3. **Domain reputation** - Verified domains get better treatment

## Solution: Set Up Gravatar

### Step 1: Create Gravatar Account

1. Go to [Gravatar.com](https://gravatar.com)
2. Sign up with your email: `noreply@baawa.ng`
3. Upload your brand icon (the same one from `/public/logo/baawa-icon-brand-color.png`)

### Step 2: Verify Your Domain

1. In Gravatar, go to "My Account" → "My Profile"
2. Add your domain `baawa.ng` to your profile
3. Verify the domain (Gravatar will send a verification email)

### Step 3: Set Up for All Team Emails

For each team member who sends emails:
1. Create Gravatar account with their email
2. Upload the same brand icon
3. This ensures consistent branding across all emails

## Alternative: Resend Sender Profile

### Step 1: Check Resend Dashboard

1. Go to [Resend Dashboard](https://resend.com/dashboard)
2. Navigate to "Domains" → `baawa.ng`
3. Look for "Sender Profile" or "Branding" settings

### Step 2: Upload Brand Icon

1. Upload your brand icon to Resend
2. Set it as the default avatar for your domain
3. This will apply to all emails sent from your domain

## Testing

After setup, test by sending an email to yourself and checking if the avatar appears in:
- Gmail
- Outlook
- Apple Mail
- Other email clients

## Expected Results

- **Gmail**: May show your brand icon in the sender avatar
- **Outlook**: Likely to show the icon if Gravatar is set up
- **Apple Mail**: May show the icon depending on settings
- **Other clients**: Varies by client

## Notes

- Email clients cache avatars, so changes may take time to appear
- Some clients ignore custom avatars for security reasons
- The most reliable method is Gravatar + domain verification
- Resend's sender profile (if available) is the most direct method

## Next Steps

1. Set up Gravatar for `noreply@baawa.ng`
2. Check Resend dashboard for sender profile options
3. Test with different email clients
4. Consider setting up Gravatar for all team email addresses 