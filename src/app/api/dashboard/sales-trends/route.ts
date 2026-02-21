import { prisma } from '@/lib/db';
import { withAuth, AuthenticatedRequest } from '@/lib/api-middleware';
import { createApiResponse } from '@/lib/api-response';
import { Prisma } from '@prisma/client';
import { SUCCESSFUL_PAYMENT_STATUSES } from '@/lib/constants';

// GET /api/dashboard/sales-trends - Get sales trends for the last 7 days
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');
    const daysParam = parseInt(searchParams.get('days') || '7', 10);
    const fallbackDays =
      Number.isFinite(daysParam) && daysParam > 0
        ? Math.min(daysParam, 365)
        : 7;
    const maxDays = 365;

    const invalidFields: string[] = [];
    const parseDateParam = (value: string | null, field: string) => {
      if (!value) return undefined;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        invalidFields.push(field);
        return undefined;
      }
      return parsed;
    };

    const normalizeStartOfDay = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    const normalizeEndOfDay = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(23, 59, 59, 999);
      return normalized;
    };

    let startDate: Date;
    let endDate: Date;

    if (dateFromParam || dateToParam) {
      const parsedFrom = parseDateParam(dateFromParam, 'dateFrom');
      const parsedTo = parseDateParam(dateToParam, 'dateTo');

      if (invalidFields.length > 0) {
        return createApiResponse.validationError(
          `Invalid ${invalidFields.join(', ')}`
        );
      }

      if (parsedFrom) {
        startDate = normalizeStartOfDay(parsedFrom);
      } else {
        startDate = normalizeStartOfDay(parsedTo!);
      }

      if (parsedTo) {
        endDate = normalizeEndOfDay(parsedTo);
      } else {
        endDate = normalizeEndOfDay(new Date());
      }

      if (startDate > endDate) {
        const swap = startDate;
        startDate = endDate;
        endDate = swap;
      }
    } else {
      endDate = normalizeEndOfDay(new Date());
      startDate = normalizeStartOfDay(new Date());
      startDate.setDate(startDate.getDate() - (fallbackDays - 1));
    }

    const msPerDay = 24 * 60 * 60 * 1000;
    let totalDays =
      Math.floor(
        (normalizeStartOfDay(endDate).getTime() -
          normalizeStartOfDay(startDate).getTime()) /
          msPerDay
      ) + 1;

    if (totalDays > maxDays) {
      startDate = new Date(endDate.getTime() - (maxDays - 1) * msPerDay);
      startDate = normalizeStartOfDay(startDate);
      totalDays = maxDays;
    }

    const dailySales = await prisma.$queryRaw<
      Array<{ day: Date; sales: unknown; transactions: number }>
    >`
      SELECT
        date_trunc('day', "created_at") AS day,
        COALESCE(SUM("total_amount"), 0) AS sales,
        COUNT(*)::int AS transactions
      FROM "sales_transactions"
      WHERE "created_at" >= ${startDate}
        AND "created_at" <= ${endDate}
        AND "transaction_type" = 'sale'
        AND "payment_status" IN (${Prisma.join(SUCCESSFUL_PAYMENT_STATUSES)})
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const salesMap = new Map(
      dailySales.map(row => [row.day.toISOString().split('T')[0], row])
    );

    // Create a map of all days with default values
    const salesData = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < totalDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];

      const daySales = salesMap.get(dateKey);

      salesData.push({
        day: dayName,
        sales: daySales ? Number(daySales.sales) : 0,
        transactions: daySales?.transactions || 0,
        date: dateKey,
      });
    }

    return createApiResponse.success(
      salesData,
      'Sales trends data retrieved successfully'
    );
  } catch (error) {
    console.error('Error fetching sales trends:', error);
    return createApiResponse.error(
      'Failed to fetch sales trends data',
      500,
      error
    );
  }
});
