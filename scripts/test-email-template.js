const { EmailService } = require('../src/lib/email/service');

async function sendTestEmail() {
  try {
    console.log('🚀 Sending test email with updated brand colors...');
    
    // Create email service
    const emailService = new EmailService({
      provider: 'resend',
      fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@baawa.com',
      fromName: 'Baawa Accessories',
      replyToEmail: process.env.REPLY_TO_EMAIL
    });

    // Test data for welcome email
    const testData = {
      firstName: 'Test User',
      email: 'baawapay@gmail.com',
      companyName: 'Baawa Accessories'
    };

    // Send welcome email with updated brand colors
    await emailService.sendTemplatedEmail('welcome', 'baawapay@gmail.com', testData);
    
    console.log('✅ Test email sent successfully to baawapay@gmail.com');
    console.log('📧 Email template uses updated brand colors:');
    console.log('   - Primary Red: #ff3333');
    console.log('   - Secondary Blue: #0066ff');
    console.log('   - Tertiary Yellow: #ffff00');
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
sendTestEmail(); 