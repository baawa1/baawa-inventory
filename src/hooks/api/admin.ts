import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface AdminActivity {
  id: string;
  action: string;
  user: string;
  time: string;
  type: 'user' | 'approval' | 'deactivation';
  userData: {
    id: string;
    email: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    userStatus: string;
    createdAt?: string;
    updatedAt?: string;
  };
}

interface AdminActivityResponse {
  success: boolean;
  activities: AdminActivity[];
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

interface SystemSettingsResponse {
  success: boolean;
  settings: SystemConfig;
}

export function useAdminActivity() {
  return useQuery<AdminActivityResponse>({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      const response = await fetch('/api/admin/activity');
      if (!response.ok) {
        throw new Error('Failed to fetch admin activity');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useSystemSettings() {
  return useQuery<SystemSettingsResponse>({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch system settings');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useUpdateSystemSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: SystemConfig) => {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error('Failed to save system settings');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
}
