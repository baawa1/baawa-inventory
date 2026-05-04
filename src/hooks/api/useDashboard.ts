import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';
import { queryKeys } from '@/lib/query-client';
import { formatCalendarDateInput } from '@/lib/utils/date-range';
import type {
  DashboardAnalyticsResponse,
  DashboardOperationsResponse,
} from '@/types/dashboard';

class DashboardApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'DashboardApiError';
    this.status = status;
  }
}

async function parseDashboardResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload
        ? String(payload.error)
        : 'Failed to load dashboard data';

    throw new DashboardApiError(message, response.status);
  }

  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    payload.success &&
    'data' in payload
  ) {
    return payload.data as T;
  }

  return payload as T;
}

async function fetchDashboardAnalytics(
  dateRange: DateRange | undefined
): Promise<DashboardAnalyticsResponse> {
  const params = new URLSearchParams();

  if (dateRange?.from) {
    params.set('dateFrom', formatCalendarDateInput(dateRange.from));
  }

  if (dateRange?.to) {
    params.set('dateTo', formatCalendarDateInput(dateRange.to));
  }

  const response = await fetch(
    `/api/dashboard/analytics${params.toString() ? `?${params.toString()}` : ''}`
  );

  return parseDashboardResponse<DashboardAnalyticsResponse>(response);
}

async function fetchDashboardOperations(): Promise<DashboardOperationsResponse> {
  const response = await fetch('/api/dashboard/operations');
  return parseDashboardResponse<DashboardOperationsResponse>(response);
}

export function useDashboardAnalytics(dateRange: DateRange | undefined) {
  const dateKey =
    dateRange?.from && dateRange?.to
      ? `${formatCalendarDateInput(dateRange.from)}:${formatCalendarDateInput(dateRange.to)}`
      : 'month_to_date';

  return useQuery({
    queryKey: queryKeys.dashboard.analytics(dateKey),
    queryFn: () => fetchDashboardAnalytics(dateRange),
    enabled: !!dateRange?.from && !!dateRange?.to,
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardOperations() {
  return useQuery({
    queryKey: queryKeys.dashboard.operations(),
    queryFn: fetchDashboardOperations,
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
  });
}

export { DashboardApiError };
