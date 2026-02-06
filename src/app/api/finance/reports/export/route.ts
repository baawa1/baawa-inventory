import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { hasPermission } from '@/lib/auth/roles';
import { createApiResponse } from '@/lib/api-response';

export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    if (!hasPermission(request.user.role, 'FINANCIAL_REPORTS')) {
      return createApiResponse.forbidden(
        'Insufficient permissions to export reports'
      );
    }

    const body = await request.json();
    const { reportData, format = 'pdf', companyName } = body;

    if (!reportData) {
      return createApiResponse.validationError('Report data is required');
    }

    if (format === 'pdf') {
      // Dynamic import to avoid issues if @react-pdf/renderer is not installed
      try {
        const { renderToBuffer } = await import('@react-pdf/renderer');
        const { FinancialReportPDF } = await import('@/lib/pdf/FinancialReportPDF');

        const pdfBuffer = await renderToBuffer(
          FinancialReportPDF({ data: reportData, companyName })
        );

        return new NextResponse(new Uint8Array(pdfBuffer), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="financial-report-${Date.now()}.pdf"`,
          },
        });
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        return createApiResponse.internalError(
          'PDF generation is not available. Please install @react-pdf/renderer.'
        );
      }
    }

    if (format === 'csv') {
      const csvContent = generateCSV(reportData);
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="financial-report-${Date.now()}.csv"`,
        },
      });
    }

    if (format === 'json') {
      return new NextResponse(JSON.stringify(reportData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="financial-report-${Date.now()}.json"`,
        },
      });
    }

    return createApiResponse.validationError(
      'Invalid format. Supported: pdf, csv, json'
    );
  } catch (error) {
    console.error('Error exporting report:', error);
    return createApiResponse.internalError('Failed to export report');
  }
});

interface ReportData {
  period?: { startDate?: string; endDate?: string };
  summary?: {
    totalIncome?: number;
    totalExpenses?: number;
    grossProfit?: number;
    netProfit?: number;
  };
  paymentMethods?: Array<{ method?: string; count?: number; amount?: number }>;
}

function generateCSV(data: ReportData): string {
  const lines: string[] = [];

  // Header
  lines.push('Financial Report');
  lines.push(`Period,${data.period?.startDate || ''},${data.period?.endDate || ''}`);
  lines.push('');

  // Summary
  lines.push('Summary');
  lines.push('Metric,Amount');
  lines.push(`Total Revenue,${data.summary?.totalIncome || 0}`);
  lines.push(`Total Expenses,${data.summary?.totalExpenses || 0}`);
  lines.push(`Gross Profit,${data.summary?.grossProfit || 0}`);
  lines.push(`Net Profit,${data.summary?.netProfit || 0}`);
  lines.push('');

  // Payment Methods
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    lines.push('Payment Methods');
    lines.push('Method,Transactions,Amount');
    data.paymentMethods.forEach((pm) => {
      lines.push(`${pm.method || 'Unknown'},${pm.count || 0},${pm.amount || 0}`);
    });
  }

  return lines.join('\n');
}
