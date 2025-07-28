#!/usr/bin/env node

/**
 * Test Email Avatar Display
 * 
 * This script sends test emails to verify if the avatar/logo is displaying correctly
 * in different email clients.
 */

const { emailService } = require('../src/lib/email/service');

async function testEmailAvatar() {
  console.log('🧪 Testing Email Avatar Display...\n');

  const testEmails = [
    'baawapay+avatar-test@gmail.com',
    'baawapay+avatar-test-outlook@outlook.com',
    'baawapay+avatar-test-apple@icloud.com'
  ];

  for (const email of testEmails) {
    try {
      console.log(`📧 Sending test email to: ${email}`);
      
      await emailService.sendPasswordResetEmail(email, {
        firstName: 'Test',
        resetLink: 'https://pos.baawa.ng/reset-password?token=test',
        expiresInHours: 24,
      });

      console.log(`✅ Email sent successfully to ${email}`);
      console.log(`   Check the email client to see if the avatar appears\n`);
      
      // Wait between emails to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to send email to ${email}:`, error.message);
    }
  }

  console.log('🎯 Avatar Test Complete!');
  console.log('\n📋 What to check:');
  console.log('1. Open each email in its respective client');
  console.log('2. Look for your brand icon in the sender avatar section');
  console.log('3. Compare with the "BA" initials that were showing before');
  console.log('\n📝 Notes:');
  console.log('- Email clients cache avatars, so changes may take time');
  console.log('- Some clients ignore custom avatars for security');
  console.log('- Gravatar setup is the most reliable method');
  console.log('- Check the Resend dashboard for sender profile options');
}

// Run the test
testEmailAvatar().catch(console.error); 