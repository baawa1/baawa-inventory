#!/usr/bin/env node

const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmailFlows() {
  console.log('🔄 Testing various email flows with Resend...\n');
  
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@baawa.ng';
  const fromName = process.env.RESEND_FROM_NAME || 'Baawa Accessories';
  
  try {
    // Test password reset email
    console.log('📧 Testing password reset email...');
    const passwordResetResult = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: ['baawapay+password-reset@gmail.com'],
      subject: 'Password Reset Request - Baawa Inventory',
      text: 'Click the link to reset your password: http://localhost:3000/reset-password?token=test123',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested a password reset for your Baawa Inventory account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="http://localhost:3000/reset-password?token=test123" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
          <p>If you didn't request this, please ignore this email.</p>
          <p>Best regards,<br>Baawa Accessories Team</p>
        </div>
      `
    });
    console.log('✅ Password reset email sent - ID:', passwordResetResult.data?.id);
    
    // Test user verification email
    console.log('\n📧 Testing user verification email...');
    const verificationResult = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: ['baawapay+verification@gmail.com'],
      subject: 'Verify Your Account - Baawa Inventory',
      text: 'Welcome! Please verify your email: http://localhost:3000/verify?token=verify123',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Baawa Inventory!</h2>
          <p>Thank you for creating an account. Please verify your email address to get started.</p>
          <a href="http://localhost:3000/verify?token=verify123" 
             style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify Email
          </a>
          <p>If you didn't create this account, please ignore this email.</p>
          <p>Best regards,<br>Baawa Accessories Team</p>
        </div>
      `
    });
    console.log('✅ Verification email sent - ID:', verificationResult.data?.id);
    
    // Test admin approval email
    console.log('\n📧 Testing admin approval email...');
    const approvalResult = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: ['baawapay+admin-approval@gmail.com'],
      subject: 'New User Awaiting Approval - Baawa Inventory',
      text: 'A new user has registered and requires approval. Login to the admin panel to review.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New User Registration</h2>
          <p>A new user has registered for Baawa Inventory and requires admin approval.</p>
          <p><strong>User Details:</strong></p>
          <ul>
            <li>Email: john.doe@example.com</li>
            <li>Name: John Doe</li>
            <li>Role: Staff</li>
            <li>Registration Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          <a href="http://localhost:3000/admin/users" 
             style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Review in Admin Panel
          </a>
          <p>Best regards,<br>Baawa Inventory System</p>
        </div>
      `
    });
    console.log('✅ Admin approval email sent - ID:', approvalResult.data?.id);
    
    // Test welcome email
    console.log('\n📧 Testing welcome email...');
    const welcomeResult = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: ['baawapay+welcome@gmail.com'],
      subject: 'Welcome to Baawa Inventory System!',
      text: 'Welcome to Baawa Inventory! Your account has been approved and you can now access the system.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Baawa Inventory!</h2>
          <p>Congratulations! Your account has been approved and you now have access to the Baawa Inventory System.</p>
          <p><strong>Getting Started:</strong></p>
          <ul>
            <li>Login to your account</li>
            <li>Complete your profile</li>
            <li>Explore the inventory management features</li>
            <li>Contact support if you need help</li>
          </ul>
          <a href="http://localhost:3000/login" 
             style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Login to Your Account
          </a>
          <p>Best regards,<br>Baawa Accessories Team</p>
        </div>
      `
    });
    console.log('✅ Welcome email sent - ID:', welcomeResult.data?.id);
    
    console.log('\n🎉 All email flows tested successfully with Resend!');
    console.log('\n📬 Check these Gmail inboxes:');
    console.log('   ✉️  baawapay+password-reset@gmail.com');
    console.log('   ✉️  baawapay+verification@gmail.com');
    console.log('   ✉️  baawapay+admin-approval@gmail.com');
    console.log('   ✉️  baawapay+welcome@gmail.com');
    
    console.log('\n📊 Email Summary:');
    console.log('   • Password Reset: ✅ Sent');
    console.log('   • Email Verification: ✅ Sent');
    console.log('   • Admin Approval: ✅ Sent');
    console.log('   • Welcome Message: ✅ Sent');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
    if (error.message?.includes('domain')) {
      console.log('\n💡 Domain verification might be needed at: https://resend.com/domains');
    }
  }
}

testEmailFlows();
