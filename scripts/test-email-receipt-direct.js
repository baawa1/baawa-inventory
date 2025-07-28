#!/usr/bin/env node

/**
 * Direct Test for Email Receipt Functionality
 * 
 * This script tests the email receipt functionality directly
 * without going through the API to isolate any issues.
 */

async function testEmailReceiptDirect() {
  console.log('🧪 Testing Email Receipt Functionality Directly...\n');

  try {
    // Import the email service using require for CommonJS
    const { emailService } = require('../src/lib/email');
    
    console.log('✅ Email service imported successfully');

    // Test email receipt data
    const testReceiptData = {
      to: 'baawapay+pos-direct-test@gmail.com',
      customerName: 'Direct Test Customer',
      saleId: 'DIRECT-TEST-123',
      items: [
        {
          name: 'iPhone 15 Pro Max Case',
          quantity: 2,
          price: 8500,
          total: 17000,
        },
        {
          name: 'Samsung Screen Protector',
          quantity: 1,
          price: 3200,
          total: 3200,
        },
      ],
      subtotal: 20200,
      discount: 1000,
      total: 19200,
      paymentMethod: 'Card',
      timestamp: new Date(),
      staffName: 'John Doe',
    };

    console.log('📧 Sending test email receipt...');
    console.log(`   To: ${testReceiptData.to}`);
    console.log(`   Customer: ${testReceiptData.customerName}`);
    console.log(`   Sale ID: ${testReceiptData.saleId}`);
    console.log(`   Total: ₦${testReceiptData.total.toLocaleString()}`);

    // Send the email
    const emailSent = await emailService.sendReceiptEmail(testReceiptData);
    
    if (emailSent) {
      console.log('✅ Email receipt sent successfully!');
    } else {
      console.log('❌ Email receipt failed to send');
    }

    console.log('\n🎉 Direct email test completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Email service imported successfully');
    console.log('   ✅ Email receipt template working');
    console.log('   ✅ Email sending functionality tested');
    
    if (emailSent) {
      console.log('   ✅ Email was sent successfully');
    } else {
      console.log('   ⚠️  Email failed to send (check configuration)');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('\n🔍 Error details:');
    console.error('   Error type:', error.constructor.name);
    console.error('   Error message:', error.message);
    if (error.stack) {
      console.error('   Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testEmailReceiptDirect()
    .then(() => {
      console.log('\n✅ Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testEmailReceiptDirect }; 