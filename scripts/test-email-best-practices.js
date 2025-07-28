#!/usr/bin/env node

/**
 * Test Email Best Practices Configuration
 * 
 * This script tests the new email configuration that follows best practices
 * instead of using no-reply addresses.
 */

const { emailService } = require('../src/lib/email/service');

async function testEmailBestPractices() {
  console.log('🧪 Testing Email Best Practices Configuration...\n');

  const testEmail = 'baawapay+best-practices-test@gmail.com';

  try {
    console.log('📧 Sending test email with new configuration...');
    
    // Test password reset email (most common transactional email)
    await emailService.sendPasswordResetEmail(testEmail, {
      firstName: 'Test',
      resetLink: 'https://pos.baawa.ng/reset-password?token=test',
      expiresInHours: 24,
    });

    console.log('✅ Email sent successfully!');
    console.log('\n📋 What to check in the email:');
    console.log('1. From address should be: "Baawa Accessories <hello@baawa.ng>"');
    console.log('2. Reply-To should be: "support@baawa.ng"');
    console.log('3. No more "noreply" in the address');
    console.log('4. Email should look more professional and trustworthy');
    
    console.log('\n🎯 Benefits of this configuration:');
    console.log('✅ Better deliverability scores');
    console.log('✅ Higher engagement rates');
    console.log('✅ Professional appearance');
    console.log('✅ Users can reply for support');
    console.log('✅ Avoids spam filters');
    
    console.log('\n📝 Next Steps:');
    console.log('1. Update your .env.local with the new email addresses');
    console.log('2. Configure the new email addresses in your domain');
    console.log('3. Set up Gravatar for the new addresses');
    console.log('4. Test with different email clients');
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your RESEND_API_KEY is set');
    console.log('2. Verify your domain is configured in Resend');
    console.log('3. Make sure the new email addresses are set up');
  }
}

// Run the test
testEmailBestPractices().catch(console.error); 