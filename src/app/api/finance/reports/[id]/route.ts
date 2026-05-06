import { withAuth, type AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/db';
import {
  ACTIVE_FINANCE_REPORT_TYPES,
  getFinanceReportMethodologyStatus,
} from '@/lib/finance/reporting';

function parseReportId(value: string): number | null {
  const reportId = Number(value);
  return Number.isInteger(reportId) && reportId > 0 ? reportId : null;
}

function getGeneratedByName(user: {
  firstName: string | null;
  lastName: string | null;
  email: string;
}) {
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || user.email;
}

export const GET = withAuth(async function (
  request: AuthenticatedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_REPORTS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to access financial reports'
      );
    }

    const { id } = await params;
    const reportId = parseReportId(id);

    if (!reportId) {
      return createApiResponse.validationError('Invalid report id');
    }

    const report = await prisma.financialReport.findFirst({
      where: {
        id: reportId,
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

    if (!report) {
      return createApiResponse.notFound('Financial report');
    }

    return createApiResponse.success(
      {
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
        reportData: report.reportData,
      },
      'Financial report retrieved successfully'
    );
  } catch {
    return createApiResponse.internalError('Failed to fetch financial report');
  }
});
