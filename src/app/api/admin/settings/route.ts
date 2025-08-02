import { NextResponse } from 'next/server';
import { withPermission, AuthenticatedRequest } from '@/lib/api-middleware';
import { z } from 'zod';

const systemConfigSchema = z.object({
  // User Management Settings
  requireEmailVerification: z.boolean(),
  requireAdminApproval: z.boolean(),
  allowUserRegistration: z.boolean(),
  maxLoginAttempts: z.number().min(1).max(10),
  sessionTimeout: z.number().min(1).max(168),

  // Email Settings
  smtpHost: z.string(),
  smtpPort: z.number(),
  smtpUser: z.string(),
  smtpPassword: z.string(),
  fromEmail: z.string().email(),
  fromName: z.string(),

  // System Settings
  maintenanceMode: z.boolean(),
  debugMode: z.boolean(),
  logLevel: z.enum(['error', 'warn', 'info', 'debug']),
});

// GET /api/admin/settings - Get system settings
export const GET = withPermission(
  ['ADMIN'],
  async function (_request: AuthenticatedRequest) {
    try {
      // For now, return default settings
      // In a real app, these would be stored in a settings table
      const settings = {
        // User Management Settings
        requireEmailVerification: true,
        requireAdminApproval: true,
        allowUserRegistration: true,
        maxLoginAttempts: 5,
        sessionTimeout: 24,

        // Email Settings
        smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
        smtpPort: parseInt(process.env.SMTP_PORT || '587'),
        smtpUser: process.env.SMTP_USER || '',
        smtpPassword: process.env.SMTP_PASSWORD || '',
        fromEmail: process.env.FROM_EMAIL || 'noreply@baawa.com',
        fromName: process.env.FROM_NAME || 'BaaWA Inventory',

        // System Settings
        maintenanceMode: false,
        debugMode: process.env.NODE_ENV === 'development',
        logLevel: 'info' as const,
      };

      return NextResponse.json({
        success: true,
        settings,
      });
    } catch (error) {
      console.error('Error fetching system settings:', error);
      return NextResponse.json(
        { error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }
  }
);

// POST /api/admin/settings - Save system settings
export const POST = withPermission(
  ['ADMIN'],
  async function (request: AuthenticatedRequest) {
    try {
      const body = await request.json();

      // Validate request body
      const validation = systemConfigSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { error: 'Invalid settings data', details: validation.error.issues },
          { status: 400 }
        );
      }

      const settings = validation.data;

      // In a real app, save to database
      // For now, just validate and return success
      console.log('Saving system settings:', settings);

      return NextResponse.json({
        success: true,
        message: 'Settings saved successfully',
        settings,
      });
    } catch (error) {
      console.error('Error saving system settings:', error);
      return NextResponse.json(
        { error: 'Failed to save settings' },
        { status: 500 }
      );
    }
  }
);
