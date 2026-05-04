'use client';

import { PageHeader } from '@/components/ui/page-header';
import { FinancialKPIsWidget } from '@/components/finance/widgets/FinancialKPIsWidget';
import { AdvancedAnalytics } from '@/components/finance/AdvancedAnalytics';
import { ProfitMarginDashboard } from '@/components/finance/dashboards/ProfitMarginDashboard';
import { AccountsReceivableDashboard } from '@/components/finance/dashboards/AccountsReceivableDashboard';

export function AnalyticsReportPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <PageHeader
        title="Financial Analytics"
        description="Admin-only analytics across unified finance data, profit margins, and receivables"
      />

      <FinancialKPIsWidget months={3} />
      <AdvancedAnalytics />
      <ProfitMarginDashboard />
      <AccountsReceivableDashboard />
    </div>
  );
}
