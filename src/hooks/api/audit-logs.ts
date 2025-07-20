/**
 * TanStack Query hooks for Audit Logs API
 */

import { useQuery } from "@tanstack/react-query";

export interface AuditLogFilters {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  table_name: string;
  record_id: string | null;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  users: {
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface AuditLogsResponse {
  logs: AuditLog[];
  totalPages: number;
  totalCount: number;
  currentPage: number;
}

/**
 * Hook to fetch audit logs with filters and pagination
 */
export function useAuditLogs(filters: AuditLogFilters = {}) {
  const { page = 1, limit = 10, userId, action, from, to } = filters;

  return useQuery({
    queryKey: ["audit-logs", { page, limit, userId, action, from, to }],
    queryFn: async (): Promise<AuditLogsResponse> => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        ...(userId && { userId }),
        ...(action && { action }),
        ...(from && { from }),
        ...(to && { to }),
      });

      const response = await fetch(
        `/api/admin/audit-logs?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch audit logs: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        logs: data.logs || [],
        totalPages: data.totalPages || 1,
        totalCount: data.totalCount || 0,
        currentPage: page,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: false,
  });
}
