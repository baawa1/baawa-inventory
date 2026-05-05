import { withAuth, type AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { logger } from '@/lib/logger';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import { getFinanceAggregate, type FinanceAggregationFilters } from '@/lib/finance/ledger';
import { Prisma } from '@prisma/client';
import {
  ACTIVE_FINANCE_REPORT_TYPES,
  buildFinanceReportExportRows,
  buildFinanceReportName,
  buildFinanceReportPayload,
  resolveFinanceReportRange,
  type FinanceReportPeriod,
  type FinanceReportType,
} from '@/lib/finance/reporting';
import {
  addFinanceDateRangeIssue,
  getZodErrorMessage,
  optionalFinanceDateInputSchema,
} from '@/lib/finance/query-validation';
import { resolveActingUserId } from '@/lib/utils/resolve-acting-user-id';
import { z } from 'zod';

const financeReportPeriodSchema = z
  .enum(['weekly', 'monthly', 'quarterly', 'yearly'])
  .default('monthly');

const financeReportTypeSchema = z.enum(ACTIVE_FINANCE_REPORT_TYPES);

const reportQuerySchema = z
  .object({
    period: financeReportPeriodSchema,
    type: z.enum(['all', 'income', 'expense']).default('all'),
    paymentMethod: z.string().optional(),
    dateFrom: optionalFinanceDateInputSchema,
    dateTo: optionalFinanceDateInputSchema,
  })
  .superRefine((value, ctx) => {
    addFinanceDateRangeIssue(value.dateFrom, value.dateTo, ctx, ['dateTo']);
  });

const generateReportBodySchema = z
  .object({
    reportType: financeReportTypeSchema.default('FINANCIAL_SUMMARY'),
    period: financeReportPeriodSchema,
    type: z.enum(['all', 'income', 'expense']).default('all'),
    paymentMethod: z.string().optional(),
    dateFrom: optionalFinanceDateInputSchema,
    dateTo: optionalFinanceDateInputSchema,
    saveSnapshot: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    addFinanceDateRangeIssue(value.dateFrom, value.dateTo, ctx, ['dateTo']);
  });

function buildAggregateFilters(params: {
  period: FinanceReportPeriod;
  type: 'all' | 'income' | 'expense';
  paymentMethod?: string;
  dateFrom?: Date;
  dateTo?: Date;
}): {
  filters: FinanceAggregationFilters;
  range: ReturnType<typeof resolveFinanceReportRange>;
} {
  const range = resolveFinanceReportRange(
    params.period,
    params.dateFrom,
    params.dateTo
  );

  return {
    range,
    filters: {
      startDate: range.startDate,
      endDate: range.endDate,
      type: params.type,
      paymentMethod:
        params.paymentMethod && params.paymentMethod !== 'all'
          ? params.paymentMethod
          : undefined,
    },
  };
}

function createReportResponsePayload(params: {
  aggregate: Awaited<ReturnType<typeof getFinanceAggregate>>;
  reportType: FinanceReportType;
  period: FinanceReportPeriod;
  range: ReturnType<typeof resolveFinanceReportRange>;
}) {
  const report = buildFinanceReportPayload(params.aggregate, {
    reportType: params.reportType,
    period: params.period,
    range: params.range,
  });

  return {
    ...report,
    exportRows: buildFinanceReportExportRows(report, params.reportType),
  };
}

export const GET = withAuth(async function (request: AuthenticatedRequest) {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_REPORTS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to access financial reports'
      );
    }

    const { searchParams } = new URL(request.url);
    const validatedParams = reportQuerySchema.parse({
      period: searchParams.get('period') || undefined,
      type: searchParams.get('type') || undefined,
      paymentMethod: searchParams.get('paymentMethod') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    });

    const { range, filters } = buildAggregateFilters({
      period: validatedParams.period,
      type: validatedParams.type,
      paymentMethod: validatedParams.paymentMethod,
      dateFrom: validatedParams.dateFrom,
      dateTo: validatedParams.dateTo,
    });

    const aggregate = await getFinanceAggregate(filters, { groupBy: 'day' });
    const payload = createReportResponsePayload({
      aggregate,
      reportType: 'FINANCIAL_SUMMARY',
      period: validatedParams.period,
      range,
    });

    logger.info('Financial report preview generated', {
      userId: request.user.id,
      period: validatedParams.period,
      type: validatedParams.type,
      reportType: 'FINANCIAL_SUMMARY',
      transactionCount: aggregate.summary.totalTransactions,
    });

    return createApiResponse.success(
      payload,
      'Financial report generated successfully'
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        getZodErrorMessage(error, 'Invalid report query'),
        error.issues
      );
    }

    logger.error('Error generating financial report', {
      error: error instanceof Error ? error.message : String(error),
      userId: request.user?.id,
    });
    return createApiResponse.internalError('Failed to generate financial report');
  }
});

export const POST = withAuth(async function (request: AuthenticatedRequest) {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_REPORTS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to generate financial reports'
      );
    }

    const body = generateReportBodySchema.parse(await request.json());
    const { range, filters } = buildAggregateFilters({
      period: body.period,
      type: body.type,
      paymentMethod: body.paymentMethod,
      dateFrom: body.dateFrom,
      dateTo: body.dateTo,
    });

    const aggregate = await getFinanceAggregate(filters, { groupBy: 'day' });
    const payload = createReportResponsePayload({
      aggregate,
      reportType: body.reportType,
      period: body.period,
      range,
    });

    let snapshot:
      | {
          id: number;
          reportType: string;
          reportName: string;
          generatedAt: string;
          methodologyStatus: 'exact' | 'estimated';
        }
      | undefined;

    if (body.saveSnapshot) {
      const generatedBy = await resolveActingUserId({
        id: request.user.id,
        email: request.user.email,
      });

      if (!generatedBy) {
        return createApiResponse.unauthorized(
          'Administrator account could not be resolved. Please sign out and sign in again.'
        );
      }

      const createdReport = await prisma.financialReport.create({
        data: {
          reportType: body.reportType,
          reportName: buildFinanceReportName(body.reportType, range),
          periodStart: range.startDate,
          periodEnd: range.endDate,
          reportData: payload as unknown as Prisma.JsonObject,
          generatedBy,
        },
      });

      snapshot = {
        id: createdReport.id,
        reportType: createdReport.reportType,
        reportName: createdReport.reportName,
        generatedAt: createdReport.generatedAt.toISOString(),
        methodologyStatus: payload.methodology.status,
      };
    }

    logger.info('Financial report generated from reports API', {
      userId: request.user.id,
      period: body.period,
      type: body.type,
      reportType: body.reportType,
      saveSnapshot: body.saveSnapshot,
      snapshotId: snapshot?.id,
    });

    return createApiResponse.success(
      {
        report: payload,
        snapshot,
      },
      'Financial report generated successfully'
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        getZodErrorMessage(error, 'Invalid report request'),
        error.issues
      );
    }

    logger.error('Error creating financial report snapshot', {
      error: error instanceof Error ? error.message : String(error),
      userId: request.user?.id,
    });
    return createApiResponse.internalError('Failed to generate financial report');
  }
});
