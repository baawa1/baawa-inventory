import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email/service';
import { envConfig } from '@/lib/config/env-validation';

export async function POST(_request: NextRequest) {
  // Only allow test endpoints in development
  if (!envConfig.isDevelopment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    // Use existing logger - will only show in development
    const { logger } = await import('@/lib/logger');
    logger.debug('Sending test emails with updated brand colors and logo');

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

    logger.debug('Test emails sent successfully');
    logger.debug('Email template includes: Logo, Color scheme, Action buttons');

    return NextResponse.json({
      success: true,
      message:
        'Test emails sent successfully (development only)',
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
    const { logger } = await import('@/lib/logger');
    logger.error('Failed to send test emails', { error });

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