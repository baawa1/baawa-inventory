"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  IconSettings,
  IconShield,
  IconMail,
  IconDatabase,
  IconDeviceFloppy,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconGlobe,
  IconBell,
} from "@tabler/icons-react";
import { toast } from "sonner";

export function SystemSettings() {
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    // General Settings
    appName: "BaaWA Inventory",
    appDescription: "Modern inventory management system",
    timezone: "Africa/Lagos",
    currency: "NGN",

    // Security Settings
    passwordMinLength: 8,
    requireEmailVerification: true,
    enableTwoFactor: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,

    // Email Settings
    emailProvider: "smtp",
    smtpHost: "smtp.gmail.com",
    smtpPort: 587,
    smtpUsername: "",
    smtpPassword: "",

    // Feature Toggles
    enableRegistration: true,
    enableInventoryAlerts: true,
    enableSalesReports: true,
    enableAuditLogs: true,

    // Notification Settings
    enableEmailNotifications: true,
    enableLowStockAlerts: true,
    lowStockThreshold: 10,
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      // In a real app, this would make an API call to save settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully");
    } catch (_error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    // Reset to default values
    setSettings({
      appName: "BaaWA Inventory",
      appDescription: "Modern inventory management system",
      timezone: "Africa/Lagos",
      currency: "NGN",
      passwordMinLength: 8,
      requireEmailVerification: true,
      enableTwoFactor: false,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      emailProvider: "smtp",
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      smtpUsername: "",
      smtpPassword: "",
      enableRegistration: true,
      enableInventoryAlerts: true,
      enableSalesReports: true,
      enableAuditLogs: true,
      enableEmailNotifications: true,
      enableLowStockAlerts: true,
      lowStockThreshold: 10,
    });
    toast.info("Settings reset to defaults");
  };

  const updateSetting = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Settings</h2>
          <p className="text-muted-foreground">
            Configure application settings, security, and system preferences
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            <IconRefresh className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <IconDeviceFloppy className="h-4 w-4 mr-2" />
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconSettings className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="appName">Application Name</Label>
              <Input
                id="appName"
                value={settings.appName}
                onChange={(e) => updateSetting("appName", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="appDescription">Description</Label>
              <Textarea
                id="appDescription"
                value={settings.appDescription}
                onChange={(e) =>
                  updateSetting("appDescription", e.target.value)
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Input
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => updateSetting("timezone", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => updateSetting("currency", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconShield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="passwordMinLength">Min Password Length</Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={(e) =>
                    updateSetting("passwordMinLength", parseInt(e.target.value))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (min)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) =>
                    updateSetting("sessionTimeout", parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) =>
                  updateSetting("maxLoginAttempts", parseInt(e.target.value))
                }
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Verification Required</Label>
                  <p className="text-sm text-muted-foreground">
                    Require users to verify email before login
                  </p>
                </div>
                <Switch
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) =>
                    updateSetting("requireEmailVerification", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable 2FA for enhanced security
                  </p>
                </div>
                <Switch
                  checked={settings.enableTwoFactor}
                  onCheckedChange={(checked) =>
                    updateSetting("enableTwoFactor", checked)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconMail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input
                  id="smtpHost"
                  value={settings.smtpHost}
                  onChange={(e) => updateSetting("smtpHost", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input
                  id="smtpPort"
                  type="number"
                  value={settings.smtpPort}
                  onChange={(e) =>
                    updateSetting("smtpPort", parseInt(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpUsername">SMTP Username</Label>
              <Input
                id="smtpUsername"
                value={settings.smtpUsername}
                onChange={(e) => updateSetting("smtpUsername", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtpPassword">SMTP Password</Label>
              <Input
                id="smtpPassword"
                type="password"
                value={settings.smtpPassword}
                onChange={(e) => updateSetting("smtpPassword", e.target.value)}
              />
            </div>

            <Button variant="outline" size="sm" className="w-full">
              <IconMail className="h-4 w-4 mr-2" />
              Test Email Configuration
            </Button>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconGlobe className="h-5 w-5" />
              Feature Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>User Registration</Label>
                <p className="text-sm text-muted-foreground">
                  Allow new user registrations
                </p>
              </div>
              <Switch
                checked={settings.enableRegistration}
                onCheckedChange={(checked) =>
                  updateSetting("enableRegistration", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Inventory Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Enable low stock notifications
                </p>
              </div>
              <Switch
                checked={settings.enableInventoryAlerts}
                onCheckedChange={(checked) =>
                  updateSetting("enableInventoryAlerts", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sales Reports</Label>
                <p className="text-sm text-muted-foreground">
                  Enable sales reporting features
                </p>
              </div>
              <Switch
                checked={settings.enableSalesReports}
                onCheckedChange={(checked) =>
                  updateSetting("enableSalesReports", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Audit Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Track user actions and changes
                </p>
              </div>
              <Switch
                checked={settings.enableAuditLogs}
                onCheckedChange={(checked) =>
                  updateSetting("enableAuditLogs", checked)
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send notifications via email
                  </p>
                </div>
                <Switch
                  checked={settings.enableEmailNotifications}
                  onCheckedChange={(checked) =>
                    updateSetting("enableEmailNotifications", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Alert when stock is running low
                  </p>
                </div>
                <Switch
                  checked={settings.enableLowStockAlerts}
                  onCheckedChange={(checked) =>
                    updateSetting("enableLowStockAlerts", checked)
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) =>
                  updateSetting("lowStockThreshold", parseInt(e.target.value))
                }
              />
              <p className="text-sm text-muted-foreground">
                Alert when stock falls below this number
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconDatabase className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Database</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-700">
                Healthy
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <IconCheck className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Email Service</span>
              </div>
              <Badge variant="default" className="bg-green-100 text-green-700">
                Connected
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center gap-2">
                <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium">Backup</span>
              </div>
              <Badge
                variant="secondary"
                className="bg-yellow-100 text-yellow-700"
              >
                Pending
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
