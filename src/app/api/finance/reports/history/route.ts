import { withAuth, type AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import {
  ACTIVE_FINANCE_REPORT_TYPES,
  getFinanceReportMethodologyStatus,
} from '@/lib/finance/reporting';
import {
  buildPositiveIntegerQuerySchema,
  getZodErrorMessage,
} from '@/lib/finance/query-validation';
import { z } from 'zod';

const historyQuerySchema = z.object({
  limit: buildPositiveIntegerQuerySchema('Limit', 20, { max: 100 }),
});

function getGeneratedByName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || user.email;
}

export const GET = withAuth(async function (request: AuthenticatedRequest) {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_REPORTS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to access report history'
      );
    }

    const { searchParams } = new URL(request.url);
    const { limit } = historyQuerySchema.parse({
      limit: searchParams.get('limit') || undefined,
    });

    const reports = await prisma.financialReport.findMany({
      where: {
        reportType: {
          in: [...ACTIVE_FINANCE_REPORT_TYPES],
        },
      },
      orderBy: {
        generatedAt: 'desc',
      },
      take: limit,
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

    return createApiResponse.success(
      reports.map(report => ({
        id: report.id,
        reportType: report.reportType,
        reportName: report.reportName,
        periodStart: report.periodStart.toISOString(),
        periodEnd: report.periodEnd.toISOString(),
        generatedAt: report.generatedAt.toISOString(),
        generatedBy: {
          id: report.generatedByUser.id,
          name: getGeneratedByName(report.generatedByUser),
          email: report.generatedByUser.email,
        },
        methodologyStatus: getFinanceReportMethodologyStatus(report.reportData),
      })),
      'Financial report history retrieved successfully'
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse.validationError(
        getZodErrorMessage(error, 'Invalid report history query'),
        error.issues
      );
    }

    return createApiResponse.internalError('Failed to fetch financial report history');
  }
});
