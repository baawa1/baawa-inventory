const fs = require('fs');
const path = require('path');

/**
 * Convert logo files to base64 for email templates
 */
function convertLogoToBase64(filePath) {
  try {
    const imageBuffer = fs.readFileSync(filePath);
    const base64String = imageBuffer.toString('base64');
    const mimeType = path.extname(filePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error(`Error converting ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Generate the logo utility code with base64 data
 */
function generateLogoUtils() {
  const logoDir = path.join(__dirname, '../public/logo');
  const logoFiles = {
    'brand-color': 'baawa-icon-brand-color.png',
    'black': 'baawa-icon-black.png',
    'white': 'baawa-icon-white.png'
  };

  console.log('Converting logo files to base64...\n');

  const base64Data = {};
  
  for (const [variant, filename] of Object.entries(logoFiles)) {
    const filePath = path.join(logoDir, filename);
    
    if (fs.existsSync(filePath)) {
      const base64 = convertLogoToBase64(filePath);
      if (base64) {
        base64Data[variant] = base64;
        console.log(`✅ Converted ${filename} (${variant})`);
      } else {
        console.log(`❌ Failed to convert ${filename}`);
      }
    } else {
      console.log(`⚠️  File not found: ${filename}`);
    }
  }

  // Generate the updated logo utils code
  const logoUtilsCode = `/**
 * Logo utility functions for email templates
 */

export type LogoVariant = 'brand-color' | 'black' | 'white';

// Base64 encoded logo data for reliable email display
const LOGO_BASE64 = {
${Object.entries(base64Data).map(([variant, base64]) => `  '${variant}': '${base64}',`).join('\n')}
};

/**
 * Get the appropriate logo URL based on context
 * For email templates, use base64 encoded versions for reliability
 */
export const getLogoUrl = (variant: LogoVariant = 'brand-color', useBase64: boolean = true): string => {
  if (useBase64) {
    return LOGO_BASE64[variant] || LOGO_BASE64['brand-color'];
  }
  
  const baseUrl = 'https://inventory.baawa.com/logo';
  return \`\${baseUrl}/baawa-icon-\${variant}.png\`;
};

/**
 * Get the full logo URL (icon + text) based on context
 */
export const getFullLogoUrl = (variant: LogoVariant = 'brand-color'): string => {
  const baseUrl = 'https://inventory.baawa.com/logo';
  return \`\${baseUrl}/baawa-logo-\${variant}.png\`;
};

/**
 * Get logo variant based on email context
 */
export const getLogoVariantForContext = (context: 'welcome' | 'verification' | 'password-reset' | 'admin' | 'receipt' | 'warning'): LogoVariant => {
  switch (context) {
    case 'welcome':
    case 'verification':
    case 'receipt':
      return 'brand-color';
    case 'password-reset':
    case 'warning':
      return 'black';
    case 'admin':
      return 'white';
    default:
      return 'brand-color';
  }
};

/**
 * Get logo HTML for email templates
 * Uses base64 encoded logos for reliable email display
 */
export const getLogoHtml = (variant: LogoVariant = 'brand-color', size: 'small' | 'medium' | 'large' = 'medium'): string => {
  const logoUrl = getLogoUrl(variant, true); // Always use base64 for emails
  const sizeClass = size === 'small' ? '40px' : size === 'large' ? '80px' : '60px';
  
  return \`
    <div class="logo-container">
      <img src="\${logoUrl}" alt="BaaWA Accessories Logo" class="logo-svg" style="width: \${sizeClass}; height: \${sizeClass}; margin-right: 15px; object-fit: contain;">
      <div class="logo-text">BaaWA Accessories</div>
    </div>
  \`;
};
`;

  // Write the updated file
  const outputPath = path.join(__dirname, '../src/lib/email/utils/logo-utils.ts');
  fs.writeFileSync(outputPath, logoUtilsCode);
  
  console.log('\n✅ Generated updated logo-utils.ts with base64 data');
  console.log(`📁 Output: ${outputPath}`);
  
  // Show file sizes
  console.log('\n📊 File sizes:');
  for (const [variant, base64] of Object.entries(base64Data)) {
    const sizeInKB = Math.round(base64.length * 0.75 / 1024);
    console.log(`  ${variant}: ${sizeInKB}KB`);
  }
}

// Run the conversion
generateLogoUtils(); 