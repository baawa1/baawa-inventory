'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  IconSettings,
  IconShield,
  IconMail,
  IconDeviceFloppy,
  IconRefresh,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { useSystemSettings, useUpdateSystemSettings } from '@/hooks/api/admin';

interface SystemSettingsProps {
  activeTab?: string;
}

interface SystemConfig {
  // User Management Settings
  requireEmailVerification: boolean;
  requireAdminApproval: boolean;
  allowUserRegistration: boolean;
  maxLoginAttempts: number;
  sessionTimeout: number;

  // Email Settings
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;

  // System Settings
  maintenanceMode: boolean;
  debugMode: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export function SystemSettings({ activeTab: _activeTab }: SystemSettingsProps) {
  const { data: settingsData, isLoading: isLoadingSettings } =
    useSystemSettings();
  const updateSettingsMutation = useUpdateSystemSettings();

  const [config, setConfig] = useState<SystemConfig>({
    // User Management Settings
    requireEmailVerification: true,
    requireAdminApproval: true,
    allowUserRegistration: true,
    maxLoginAttempts: 5,
    sessionTimeout: 24,

    // Email Settings
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@baawa.com',
    fromName: 'BaaWA Inventory',

    // System Settings
    maintenanceMode: false,
    debugMode: false,
    logLevel: 'info',
  });

  // Update config when settings are loaded
  useEffect(() => {
    if (settingsData?.settings) {
      setConfig(settingsData.settings);
    }
  }, [settingsData]);

  const handleConfigChange = (key: keyof SystemConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettingsMutation.mutateAsync(config);
      toast.success('Settings saved successfully');
    } catch (_error) {
      console.error('Error saving settings:', _error);
      toast.error('Failed to save settings');
    }
  };

  const handleTestEmail = async () => {
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          smtpHost: config.smtpHost,
          smtpPort: config.smtpPort,
          smtpUser: config.smtpUser,
          smtpPassword: config.smtpPassword,
          fromEmail: config.fromEmail,
          fromName: config.fromName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to test email configuration');
      }

      toast.success('Email configuration test successful');
    } catch (_error) {
      toast.error('Failed to test email configuration');
    }
  };

  if (isLoadingSettings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <div className="text-center">
            <div className="border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
            <p className="text-muted-foreground mt-2 text-sm">
              Loading settings...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Management Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconShield className="h-5 w-5" />
            User Management Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="requireEmailVerification">
                Require Email Verification
              </Label>
              <Select
                value={config.requireEmailVerification.toString()}
                onValueChange={value =>
                  handleConfigChange(
                    'requireEmailVerification',
                    value === 'true'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="requireAdminApproval">
                Require Admin Approval
              </Label>
              <Select
                value={config.requireAdminApproval.toString()}
                onValueChange={value =>
                  handleConfigChange('requireAdminApproval', value === 'true')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowUserRegistration">
                Allow User Registration
              </Label>
              <Select
                value={config.allowUserRegistration.toString()}
                onValueChange={value =>
                  handleConfigChange('allowUserRegistration', value === 'true')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Yes</SelectItem>
                  <SelectItem value="false">No</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={config.maxLoginAttempts}
                onChange={e =>
                  handleConfigChange(
                    'maxLoginAttempts',
                    parseInt(e.target.value)
                  )
                }
                min="1"
                max="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={config.sessionTimeout}
                onChange={e =>
                  handleConfigChange('sessionTimeout', parseInt(e.target.value))
                }
                min="1"
                max="168"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconMail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={config.smtpHost}
                onChange={e => handleConfigChange('smtpHost', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                type="number"
                value={config.smtpPort}
                onChange={e =>
                  handleConfigChange('smtpPort', parseInt(e.target.value))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={config.smtpUser}
                onChange={e => handleConfigChange('smtpUser', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={config.smtpPassword}
                onChange={e =>
                  handleConfigChange('smtpPassword', e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromEmail">From Email</Label>
              <Input
                id="fromEmail"
                type="email"
                value={config.fromEmail}
                onChange={e => handleConfigChange('fromEmail', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromName">From Name</Label>
              <Input
                id="fromName"
                value={config.fromName}
                onChange={e => handleConfigChange('fromName', e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleTestEmail}>
              <IconMail className="mr-2 h-4 w-4" />
              Test Email Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconSettings className="h-5 w-5" />
            System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              <Select
                value={config.maintenanceMode.toString()}
                onValueChange={value =>
                  handleConfigChange('maintenanceMode', value === 'true')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
              {config.maintenanceMode && (
                <Badge variant="destructive" className="mt-2">
                  <IconAlertTriangle className="mr-1 h-3 w-3" />
                  System will be unavailable to users
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="debugMode">Debug Mode</Label>
              <Select
                value={config.debugMode.toString()}
                onValueChange={value =>
                  handleConfigChange('debugMode', value === 'true')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logLevel">Log Level</Label>
              <Select
                value={config.logLevel}
                onValueChange={value => handleConfigChange('logLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warn">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Button
              onClick={handleSaveSettings}
              disabled={updateSettingsMutation.isPending}
            >
              <IconDeviceFloppy className="mr-2 h-4 w-4" />
              {updateSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              <IconRefresh className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
