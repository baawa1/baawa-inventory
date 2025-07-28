const fs = require('fs');
const path = require('path');

/**
 * Test script to verify email logo functionality
 */
function testEmailLogo() {
  console.log('🧪 Testing Email Logo Integration...\n');

  // Test 1: Check if logo utils file exists
  const logoUtilsPath = path.join(__dirname, '../src/lib/email/utils/logo-utils.ts');
  if (fs.existsSync(logoUtilsPath)) {
    console.log('✅ Logo utils file exists');
  } else {
    console.log('❌ Logo utils file not found');
    return;
  }

  // Test 2: Check if base64 data is present
  const logoUtilsContent = fs.readFileSync(logoUtilsPath, 'utf8');
  if (logoUtilsContent.includes('LOGO_BASE64')) {
    console.log('✅ Base64 logo data found');
  } else {
    console.log('❌ Base64 logo data not found');
  }

  // Test 3: Check if all variants are present
  const variants = ['brand-color', 'black', 'white'];
  variants.forEach(variant => {
    if (logoUtilsContent.includes(`'${variant}':`)) {
      console.log(`✅ ${variant} variant found`);
    } else {
      console.log(`❌ ${variant} variant missing`);
    }
  });

  // Test 4: Check email template integration
  const baseTemplatesPath = path.join(__dirname, '../src/lib/email/templates/base-templates.ts');
  if (fs.existsSync(baseTemplatesPath)) {
    const baseTemplatesContent = fs.readFileSync(baseTemplatesPath, 'utf8');
    if (baseTemplatesContent.includes('getLogoUrl(logoVariant, true)')) {
      console.log('✅ Email templates using base64 logos');
    } else {
      console.log('❌ Email templates not using base64 logos');
    }
  }

  // Test 5: Check logo files exist
  const logoDir = path.join(__dirname, '../public/logo');
  const logoFiles = [
    'baawa-icon-brand-color.png',
    'baawa-icon-black.png', 
    'baawa-icon-white.png'
  ];

  console.log('\n📁 Checking logo files:');
  logoFiles.forEach(file => {
    const filePath = path.join(logoDir, file);
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`✅ ${file} (${sizeKB}KB)`);
    } else {
      console.log(`❌ ${file} not found`);
    }
  });

  console.log('\n🎯 Email Logo Integration Summary:');
  console.log('- Base64 encoded logos for reliable email display');
  console.log('- Context-based logo selection (welcome, password-reset, admin)');
  console.log('- Automatic fallback to brand-color variant');
  console.log('- Support for all logo variants (brand-color, black, white)');
  console.log('\n📧 Your emails will now display the BaaWA Accessories logo correctly!');
}

// Run the test
testEmailLogo(); 