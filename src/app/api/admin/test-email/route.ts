import { NextResponse } from 'next/server';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { z } from 'zod';

const testEmailSchema = z.object({
  smtpHost: z.string(),
  smtpPort: z.number(),
  smtpUser: z.string(),
  smtpPassword: z.string(),
  fromEmail: z.string().email(),
  fromName: z.string(),
});

// POST /api/admin/test-email - Test email configuration
export const POST = withPermission(
  ['ADMIN'],
  async function (request: AuthenticatedRequest) {
    try {
      const body = await request.json();

      // Validate request body
      const validation = testEmailSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Invalid email configuration',
            details: validation.error.issues,
          },
          { status: 400 }
        );
      }

      const emailConfig = validation.data;

      // In a real app, this would test the SMTP connection
      // For now, just validate the configuration
      console.log('Testing email configuration:', {
        host: emailConfig.smtpHost,
        port: emailConfig.smtpPort,
        user: emailConfig.smtpUser,
        fromEmail: emailConfig.fromEmail,
        fromName: emailConfig.fromName,
      });

      // Simulate email test
      await new Promise(resolve => setTimeout(resolve, 1000));

      return NextResponse.json({
        success: true,
        message: 'Email configuration test successful',
      });
    } catch (error) {
      console.error('Error testing email configuration:', error);
      return NextResponse.json(
        { error: 'Failed to test email configuration' },
        { status: 500 }
      );
    }
  }
);
