import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/service';

export async function POST(_request: NextRequest) {
  try {
    console.log('🚀 Sending test emails with updated brand colors and logo...');

    // Test data for welcome email
    const testData = {
      firstName: 'Test User',
      email: 'baawapay@gmail.com',
      companyName: 'Baawa Accessories',
    };

    // Send welcome email with updated brand colors and logo to all addresses
    // Add delays to respect rate limits
    // await emailService.sendWelcomeEmail('bmdebell32@gmail.com', testData);
    // await new Promise(resolve => setTimeout(resolve, 600)); // 600ms delay
    await emailService.sendWelcomeEmail('baawaaccessories@gmail.com', testData);

    console.log('✅ Test emails sent successfully!');
    console.log('📧 Email template includes:');
    console.log('   - Baawa Accessories Logo');
    console.log('   - Primary Red: #ff3333');
    console.log('   - Secondary Blue: #0066ff');
    console.log('   - Action Buttons (Dashboard & Support)');
    console.log('   - Professional Layout');

    return NextResponse.json({
      success: true,
      message:
        'Test emails sent successfully to bmdebell32@gmail.com and baawaaccessories@gmail.com',
      recipients: ['bmdebell32@gmail.com', 'baawaaccessories@gmail.com'],
      features: {
        logo: 'Baawa Accessories Logo included',
        colors: {
          primary: '#ff3333',
          secondary: '#0066ff',
          tertiary: '#ffff00',
        },
        buttons: ['Access Dashboard', 'Contact Support'],
        layout: 'Professional responsive design',
      },
    });
  } catch (error) {
    console.error('❌ Failed to send test emails:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send test emails',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
