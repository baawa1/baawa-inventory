import { format } from 'date-fns';
import { prisma } from '../src/lib/db';
import { getFinanceAggregate } from '../src/lib/finance/ledger';

function parseArgs(argv: string[]) {
  const save = argv.includes('--save');
  const generatedByArg = argv.find(arg => arg.startsWith('--generatedBy='));
  const fromArg = argv.find(arg => arg.startsWith('--from='));
  const toArg = argv.find(arg => arg.startsWith('--to='));

  return {
    save,
    generatedBy: generatedByArg
      ? Number(generatedByArg.split('=')[1])
      : undefined,
    from: fromArg ? new Date(fromArg.split('=')[1]) : undefined,
    to: toArg ? new Date(toArg.split('=')[1]) : undefined,
  };
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function nextMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

async function getEarliestOperationalDate() {
  const [manual, stock, sales] = await Promise.all([
    prisma.financialTransaction.aggregate({
      _min: { transactionDate: true },
    }),
    prisma.stockAddition.aggregate({
      _min: { purchaseDate: true },
    }),
    prisma.salesTransaction.aggregate({
      _min: { created_at: true },
    }),
  ]);

  const candidates = [
    manual._min.transactionDate,
    stock._min.purchaseDate,
    sales._min.created_at,
  ].filter(Boolean) as Date[];

  if (candidates.length === 0) {
    return startOfMonth(new Date());
  }

  return startOfMonth(
    candidates.reduce((earliest, current) =>
      current.getTime() < earliest.getTime() ? current : earliest
    )
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.save && (!args.generatedBy || Number.isNaN(args.generatedBy))) {
    throw new Error(
      'Saving rebuilt reports requires --generatedBy=<userId>.'
    );
  }

  const fromDate = args.from && !Number.isNaN(args.from.getTime())
    ? startOfMonth(args.from)
    : await getEarliestOperationalDate();
  const toDate = args.to && !Number.isNaN(args.to.getTime())
    ? endOfMonth(args.to)
    : endOfMonth(new Date());

  const rebuiltPeriods: Array<{
    period: string;
    methodology: string;
    operatingRevenue: number;
    netProfit: number;
    netCashMovement: number;
    receivablesOutstanding: number;
    inventoryValueOnHand: number;
    estimatedReasons: string[];
    reconciliation: {
      existingReportId?: number;
      existingNetProfit?: number;
      deltaVsExistingNetProfit?: number;
    };
  }> = [];

  for (
    let cursor = new Date(fromDate);
    cursor.getTime() <= toDate.getTime();
    cursor = nextMonth(cursor)
  ) {
    const periodStart = startOfMonth(cursor);
    const periodEnd = endOfMonth(cursor);
    const aggregate = await getFinanceAggregate({
      startDate: periodStart,
      endDate: periodEnd,
    });

    const existingReport = await prisma.financialReport.findFirst({
      where: {
        periodStart,
        periodEnd,
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    const existingNetProfit =
      existingReport &&
      typeof existingReport.reportData === 'object' &&
      existingReport.reportData !== null &&
      'summary' in existingReport.reportData &&
      typeof (existingReport.reportData as any).summary?.netProfit === 'number'
        ? Number((existingReport.reportData as any).summary.netProfit)
        : undefined;

    const rebuiltRecord = {
      period: format(periodStart, 'yyyy-MM'),
      methodology: aggregate.methodology.status,
      operatingRevenue: aggregate.trading.operatingRevenue,
      netProfit: aggregate.trading.netProfit,
      netCashMovement: aggregate.cashMovement.netCashMovement,
      receivablesOutstanding: aggregate.businessPosition.receivablesOutstanding,
      inventoryValueOnHand: aggregate.businessPosition.inventoryValueOnHand,
      estimatedReasons: aggregate.methodology.reasons,
      reconciliation: {
        existingReportId: existingReport?.id,
        existingNetProfit,
        deltaVsExistingNetProfit:
          typeof existingNetProfit === 'number'
            ? Math.round(
                (aggregate.trading.netProfit - existingNetProfit) * 100
              ) / 100
            : undefined,
      },
    };

    rebuiltPeriods.push(rebuiltRecord);

    if (args.save && args.generatedBy) {
      await prisma.financialReport.create({
        data: {
          reportType: 'FINANCE_HISTORY_REBUILD',
          reportName: `Finance history rebuild ${rebuiltRecord.period}`,
          periodStart,
          periodEnd,
          reportData: {
            trading: { ...aggregate.trading },
            cashMovement: { ...aggregate.cashMovement },
            businessPosition: { ...aggregate.businessPosition },
            methodology: {
              ...aggregate.methodology,
              reasons: [...aggregate.methodology.reasons],
            },
            summary: {
              totalTransactions: aggregate.summary.totalTransactions,
              totalIncome: aggregate.summary.totalIncome,
              totalExpenses: aggregate.summary.totalExpenses,
              netProfit: aggregate.summary.netProfit,
            },
            reconciliation: { ...rebuiltRecord.reconciliation },
          } as any,
          generatedBy: args.generatedBy,
        },
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        rebuiltFrom: format(fromDate, 'yyyy-MM-dd'),
        rebuiltTo: format(toDate, 'yyyy-MM-dd'),
        periods: rebuiltPeriods,
        saved: args.save,
      },
      null,
      2
    )
  );
}

main()
  .catch(async error => {
    console.error(
      error instanceof Error ? error.message : 'Finance rebuild failed'
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
