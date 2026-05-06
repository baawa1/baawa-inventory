import { withAuth, type AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import {
  ACTIVE_FINANCE_REPORT_TYPES,
  getFinanceReportMethodologyStatus,
} from '@/lib/finance/reporting';

type JsonRecord = Record<string, unknown>;

function parseReportId(value: string | null): number | null {
  const reportId = Number(value);
  return Number.isInteger(reportId) && reportId > 0 ? reportId : null;
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function getNestedNumber(source: unknown, path: string[]): number {
  let current: unknown = source;

  for (const segment of path) {
    current = asRecord(current)[segment];
  }

  return typeof current === 'number' && Number.isFinite(current) ? current : 0;
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function percentageChange(base: number, comparison: number): number {
  if (base === 0) {
    if (comparison === 0) {
      return 0;
    }

    return comparison > 0 ? 100 : -100;
  }

  return roundCurrency(((comparison - base) / Math.abs(base)) * 100);
}

function buildDelta(baseData: unknown, comparisonData: unknown, path: string[]) {
  const base = getNestedNumber(baseData, path);
  const comparison = getNestedNumber(comparisonData, path);

  return {
    base,
    comparison,
    delta: roundCurrency(comparison - base),
    percentageChange: percentageChange(base, comparison),
  };
}

function buildReportDeltas(baseData: unknown, comparisonData: unknown) {
  return {
    summary: {
      totalIncome: buildDelta(baseData, comparisonData, ['summary', 'totalIncome']),
      totalExpenses: buildDelta(baseData, comparisonData, [
        'summary',
        'totalExpenses',
      ]),
      grossProfit: buildDelta(baseData, comparisonData, ['summary', 'grossProfit']),
      netProfit: buildDelta(baseData, comparisonData, ['summary', 'netProfit']),
      totalTransactions: buildDelta(baseData, comparisonData, [
        'summary',
        'totalTransactions',
      ]),
    },
    trading: {
      salesRevenue: buildDelta(baseData, comparisonData, [
        'trading',
        'salesRevenue',
      ]),
      operatingRevenue: buildDelta(baseData, comparisonData, [
        'trading',
        'operatingRevenue',
      ]),
      costOfGoodsSold: buildDelta(baseData, comparisonData, [
        'trading',
        'costOfGoodsSold',
      ]),
      operatingExpenses: buildDelta(baseData, comparisonData, [
        'trading',
        'operatingExpenses',
      ]),
      netProfit: buildDelta(baseData, comparisonData, ['trading', 'netProfit']),
    },
    cashMovement: {
      cashReceived: buildDelta(baseData, comparisonData, [
        'cashMovement',
        'cashReceived',
      ]),
      cashSpent: buildDelta(baseData, comparisonData, [
        'cashMovement',
        'cashSpent',
      ]),
      ownerFunding: buildDelta(baseData, comparisonData, [
        'cashMovement',
        'ownerFunding',
      ]),
      stockPurchases: buildDelta(baseData, comparisonData, [
        'cashMovement',
        'stockPurchases',
      ]),
      netCashMovement: buildDelta(baseData, comparisonData, [
        'cashMovement',
        'netCashMovement',
      ]),
    },
    businessPosition: {
      inventoryValueOnHand: buildDelta(baseData, comparisonData, [
        'businessPosition',
        'inventoryValueOnHand',
      ]),
      receivablesOutstanding: buildDelta(baseData, comparisonData, [
        'businessPosition',
        'receivablesOutstanding',
      ]),
      inventoryUnitsOnHand: buildDelta(baseData, comparisonData, [
        'businessPosition',
        'inventoryUnitsOnHand',
      ]),
      customersWithBalances: buildDelta(baseData, comparisonData, [
        'businessPosition',
        'customersWithBalances',
      ]),
    },
  };
}

function serializeReport(report: {
  id: number;
  reportType: string;
  reportName: string;
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
  reportData: unknown;
  generatedByUser: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}) {
  const generatedByName =
    `${report.generatedByUser.firstName || ''} ${report.generatedByUser.lastName || ''}`.trim() ||
    report.generatedByUser.email;

  return {
    id: report.id,
    reportType: report.reportType,
    reportName: report.reportName,
    periodStart: report.periodStart.toISOString(),
    periodEnd: report.periodEnd.toISOString(),
    generatedAt: report.generatedAt.toISOString(),
    generatedBy: {
      id: report.generatedByUser.id,
      name: generatedByName,
      email: report.generatedByUser.email,
    },
    methodologyStatus: getFinanceReportMethodologyStatus(report.reportData),
  };
}

export const GET = withAuth(async function (request: AuthenticatedRequest) {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_REPORTS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to compare financial reports'
      );
    }

    const { searchParams } = new URL(request.url);
    const baseId = parseReportId(searchParams.get('baseId'));
    const comparisonId = parseReportId(searchParams.get('comparisonId'));

    if (!baseId || !comparisonId) {
      return createApiResponse.validationError(
        'Both baseId and comparisonId are required'
      );
    }

    if (baseId === comparisonId) {
      return createApiResponse.validationError(
        'Choose two different report snapshots to compare'
      );
    }

    const reports = await prisma.financialReport.findMany({
      where: {
        id: {
          in: [baseId, comparisonId],
        },
        reportType: {
          in: [...ACTIVE_FINANCE_REPORT_TYPES],
        },
      },
      include: {
        generatedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const base = reports.find(report => report.id === baseId);
    const comparison = reports.find(report => report.id === comparisonId);

    if (!base || !comparison) {
      return createApiResponse.notFound('Financial report');
    }

    return createApiResponse.success(
      {
        base: serializeReport(base),
        comparison: serializeReport(comparison),
        deltas: buildReportDeltas(base.reportData, comparison.reportData),
      },
      'Financial reports compared successfully'
    );
  } catch {
    return createApiResponse.internalError('Failed to compare financial reports');
  }
});
