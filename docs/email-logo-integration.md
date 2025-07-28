# Email Logo Integration

This document explains how to use the BaaWA Accessories logo assets in email templates.

## Available Logo Assets

The following logo assets are available in the `public/logo/` directory:

### Icon Variants
- `baawa-icon-brand-color.png` - Brand color icon (default)
- `baawa-icon-black.png` - Black icon
- `baawa-icon-white.png` - White icon

### Full Logo Variants
- `baawa-logo-brand-color.png` - Brand color logo with text
- `baawa-logo-black.png` - Black logo with text
- `baawa-logo-white.png` - White logo with text

## Usage in Email Templates

### Base64 Encoded Logos

The email templates now use **base64 encoded logos** for reliable display across all email clients. This ensures logos always display correctly, even when external images are blocked.

### Basic Usage

The email templates automatically use the brand-color logo by default:

```typescript
import { createBaseTemplate } from '@/lib/email/templates/base-templates';

const emailHtml = createBaseTemplate(content, 'Email Title');
```

### Context-Based Logo Selection

Use different logo variants based on email context:

```typescript
import { getLogoVariantForContext } from '@/lib/email/utils/logo-utils';

// For welcome emails (uses brand-color)
const welcomeHtml = createBaseTemplate(content, 'Welcome', getLogoVariantForContext('welcome'));

// For password reset emails (uses black)
const resetHtml = createBaseTemplate(content, 'Reset Password', getLogoVariantForContext('password-reset'));

// For admin emails (uses white)
const adminHtml = createBaseTemplate(content, 'Admin Notice', getLogoVariantForContext('admin'));
```

### Manual Logo Selection

You can also manually specify the logo variant:

```typescript
// Use brand-color logo
const html1 = createBaseTemplate(content, 'Title', 'brand-color');

// Use black logo
const html2 = createBaseTemplate(content, 'Title', 'black');

// Use white logo
const html3 = createBaseTemplate(content, 'Title', 'white');
```

## Logo Utility Functions

### `getLogoUrl(variant, useBase64)`

Returns the URL for a specific logo variant:

```typescript
import { getLogoUrl } from '@/lib/email/utils/logo-utils';

// For emails (base64 encoded - recommended)
const brandLogoUrl = getLogoUrl('brand-color');
// Returns: data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmH...

// For web use (external URL)
const webLogoUrl = getLogoUrl('brand-color', false);
// Returns: https://inventory.baawa.com/logo/baawa-icon-brand-color.png
```

### `getFullLogoUrl(variant)`

Returns the URL for a full logo (icon + text):

```typescript
import { getFullLogoUrl } from '@/lib/email/utils/logo-utils';

const fullLogoUrl = getFullLogoUrl('brand-color');
// Returns: https://inventory.baawa.com/logo/baawa-logo-brand-color.png
```

### `getLogoVariantForContext(context)`

Returns the appropriate logo variant based on email context:

```typescript
import { getLogoVariantForContext } from '@/lib/email/utils/logo-utils';

const contexts = {
  'welcome': 'brand-color',
  'verification': 'brand-color', 
  'receipt': 'brand-color',
  'password-reset': 'black',
  'warning': 'black',
  'admin': 'white'
};
```

## Email Template Contexts

Different email types use different logo variants:

- **Welcome/Verification/Receipt emails**: Brand color logo (friendly, positive)
- **Password reset/Warning emails**: Black logo (serious, important)
- **Admin notifications**: White logo (clean, professional)

## Custom Logo HTML

For custom logo implementations, use the `getLogoHtml` function:

```typescript
import { getLogoHtml } from '@/lib/email/utils/logo-utils';

const logoHtml = getLogoHtml('brand-color', 'medium');
// Returns HTML with logo image and text
```

## Testing

Run the logo utility tests:

```bash
npm test src/lib/email/utils/logo-utils.test.ts
```

## Updating Logos

When you update your logo files, regenerate the base64 data:

```bash
node scripts/convert-logos-to-base64.js
```

This script will:
1. Convert your logo files to base64
2. Update the `logo-utils.ts` file with new data
3. Show file sizes for each variant

## Robust Email Template

For better email client compatibility, use the `createRobustEmailTemplate` function:

```typescript
import { createRobustEmailTemplate } from '@/lib/email/templates/base-templates';

const html = createRobustEmailTemplate(
  content,
  'Email Title',
  'brand-color'
);
```

This template includes:
- **Table-based layout** for better email client compatibility
- **Inline styles** to prevent CSS stripping
- **Base64 encoded logos** for reliable display
- **Responsive design** for mobile email clients

## Best Practices

1. **Use `createRobustEmailTemplate`** for better email client compatibility
2. **Use base64 encoded logos** for reliable email display
3. **Use context-based selection** for automatic logo choice
4. **Test email rendering** in different email clients
5. **Use appropriate logo variants** for different email types
6. **Keep logo sizes consistent** across all email templates
7. **Update logo files** by running the conversion script when logos change

## Troubleshooting

### Logo not displaying in emails
- **Use `createRobustEmailTemplate`** for better email client compatibility
- Base64 encoded logos should display in all email clients
- If logos still don't display, check the base64 data is valid
- Run the conversion script to regenerate base64 data: `node scripts/convert-logos-to-base64.js`
- The robust template uses table-based layout and inline styles to prevent attribute stripping

### Wrong logo variant
- Use `getLogoVariantForContext()` for automatic selection
- Check the email context parameter
- Verify the logo variant exists

### Logo too large/small
- Adjust the CSS in the email template
- Use the `getLogoHtml()` function with size parameter
- Test in different email clients

### Email clients stripping src attributes
- The robust template is designed to handle this issue
- Uses table-based layout for better compatibility
- Includes inline styles to prevent CSS stripping
- Base64 encoding ensures logos are embedded in the HTML 