import { format, isSameDay, startOfMonth, startOfWeek } from 'date-fns';
import { prisma } from '@/lib/db';
import {
  FINANCIAL_TYPES,
  INCOME_SOURCE_LABELS,
  INCOME_SOURCES,
  EXPENSE_TYPE_LABELS,
} from '@/lib/constants/finance';
import { normalizePaymentMethodForStorage } from '@/lib/utils/payment-methods';
import {
  buildFinanceRange,
  getPreviousFinanceRange,
  type FinanceRange,
} from './date-range';
import {
  isManualExpenseTypeBlocked,
  isManualIncomeSourceBlocked,
  REPORTABLE_MANUAL_FINANCE_STATUSES,
} from './manual-transaction-policy';
import {
  getFinanceUserDisplayName,
  isFinancialTransactionMutable,
} from './transaction-access';

export type FinanceTransactionType = 'INCOME' | 'EXPENSE';
export type FinanceGroupBy = 'day' | 'week' | 'month';
export type FinanceSource = 'MANUAL' | 'POS' | 'STOCK';
export type FinanceEventType =
  | 'OWNER_FUNDING_IN'
  | 'STOCK_PURCHASE'
  | 'MANUAL_OPERATING_INCOME'
  | 'MANUAL_OPERATING_EXPENSE'
  | 'POS_CASH_SALE'
  | 'POS_DEBT_SALE_ISSUED'
  | 'POS_DEBT_PAYMENT_COLLECTED';

export interface FinanceAggregationFilters {
  startDate?: Date;
  endDate?: Date;
  type?: 'all' | 'income' | 'expense';
  paymentMethod?: string;
  status?: string;
  source?: string;
  eventType?: string;
  cashImpact?: 'in' | 'out' | 'none' | string;
  profitImpact?: 'in' | 'out' | 'none' | string;
  paymentState?: string;
  search?: string;
}

export interface NormalizedFinanceTransaction {
  id: number;
  rowId: string;
  source: FinanceSource;
  sourceId: number;
  sourceModel:
    | 'FinancialTransaction'
    | 'SalesTransaction'
    | 'StockAddition'
    | 'TransactionPayment'
    | 'SplitPayment';
  sourcePath: string | null;
  eventType: FinanceEventType;
  displayLabel: string;
  transactionNumber: string;
  type: FinanceTransactionType;
  amount: number;
  date: Date;
  paymentMethod: string | null;
  description: string;
  category: string;
  categoryLabel: string;
  status: string;
  paymentState: string | null;
  cashIn: number;
  cashOut: number;
  profitIn: number;
  profitOut: number;
  inventoryValueIn: number;
  inventoryValueOut: number;
  receivableIncrease: number;
  receivableDecrease: number;
  netCashImpact: number;
  netProfitImpact: number;
  netInventoryImpact: number;
  netReceivableImpact: number;
  createdBy: number | null;
  createdByName?: string;
  vendorName?: string | null;
  payerName?: string | null;
  customerName?: string | null;
  actorName?: string | null;
  reference?: string | null;
  flaggedOverlap: boolean;
  editable: boolean;
  estimated: boolean;
  estimatedReason?: string | null;
  metadata?: Record<string, unknown>;
}

export interface FinanceSummaryTotals {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topPaymentMethod: string;
}

export interface FinanceTradingSummary {
  salesRevenue: number;
  manualOperatingIncome: number;
  operatingRevenue: number;
  costOfGoodsSold: number;
  operatingExpenses: number;
  grossProfit: number;
  netProfit: number;
}

export interface FinanceCashMovementSummary {
  cashReceived: number;
  cashSpent: number;
  customerCollections: number;
  ownerFunding: number;
  stockPurchases: number;
  operatingExpensePayments: number;
  manualIncomeCollections: number;
  netCashMovement: number;
}

export interface FinanceBusinessPositionSummary {
  inventoryValueOnHand: number;
  inventoryUnitsOnHand: number;
  inventorySkusTracked: number;
  receivablesOutstanding: number;
  receivableTransactions: number;
  customersWithBalances: number;
  estimated: boolean;
  estimatedReasons: string[];
}

export interface FinanceMethodology {
  status: 'exact' | 'estimated';
  estimated: boolean;
  rebuiltFromOperationalData: boolean;
  historicalRebuild: 'best_effort';
  reasons: string[];
}

export interface FinanceAggregateResult {
  transactions: NormalizedFinanceTransaction[];
  summary: FinanceSummaryTotals;
  paymentMethodDistribution: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  dailyTrends: Array<{
    date: string;
    revenue: number;
    expenses: number;
    netProfit: number;
    transactions: number;
  }>;
  expenseBreakdown: Record<string, number>;
  topVendors: Array<{
    vendor: string;
    amount: number;
    category: string;
  }>;
  trading: FinanceTradingSummary;
  cashMovement: FinanceCashMovementSummary;
  businessPosition: FinanceBusinessPositionSummary;
  methodology: FinanceMethodology;
}

export interface FinanceOverlapEntry {
  id: number;
  transactionNumber: string;
  type: FinanceTransactionType;
  amount: number;
  transactionDate: Date;
  description: string | null;
  status: string;
  category: string;
  categoryLabel: string;
  createdBy: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface ReceivablesSnapshot {
  receivables: Array<{
    id: number;
    transactionNumber: string;
    customer: {
      id?: number;
      name?: string | null;
      email?: string | null;
      phone?: string | null;
    };
    saleDate: Date;
    totalAmount: number;
    paidAmount: number;
    outstandingAmount: number;
    daysOutstanding: number;
    agingBucket: '0-30' | '31-60' | '61-90' | '90+';
    paymentStatus: string;
    createdBy?: {
      id: number;
      firstName: string;
      lastName: string;
    } | null;
    payments: Array<{
      amount: number;
      paymentDate: Date | null;
      paymentMethod: string;
    }>;
  }>;
  summary: {
    totalOutstanding: number;
    totalTransactions: number;
    averageDaysOutstanding: number;
    customersWithBalances: number;
  };
}

type ManualStatusMode = 'reportable' | 'all';

const PAYMENT_TOLERANCE = 0.01;
const IGNORED_SALE_STATUSES = new Set([
  'CANCELLED',
  'cancelled',
  'REFUNDED',
  'refunded',
]);
const ESTIMATED_COGS_REASON =
  'Some historical sales do not have exact cost-at-sale snapshots. Cost of goods sold uses the best available product cost estimate for those rows.';
const ESTIMATED_INVENTORY_REASON =
  'Historical inventory value is reconstructed from current stock and later stock movements, so past periods are best-effort estimates.';

function toAmount(value: unknown): number {
  return Number(value || 0);
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function normalizeText(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export function normalizeFinancePaymentMethod(
  method?: string | null
): string | null {
  if (!method) {
    return null;
  }

  const normalized = normalizePaymentMethodForStorage(method) || method;

  switch (normalized.toLowerCase()) {
    case 'cash':
      return 'CASH';
    case 'bank':
    case 'bank_transfer':
      return 'BANK_TRANSFER';
    case 'pos':
    case 'pos_machine':
      return 'POS_MACHINE';
    case 'credit_card':
      return 'CREDIT_CARD';
    case 'mobile':
    case 'mobile_money':
      return 'MOBILE_MONEY';
    case 'debt':
    case 'debt_deposit':
    case 'deposit':
      return 'DEBT';
    case 'split':
    case 'multiple':
      return 'SPLIT';
    default:
      return normalized.toUpperCase();
  }
}

function displayPaymentMethod(method?: string | null): string {
  if (!method) {
    return 'Unspecified';
  }

  switch (method) {
    case 'BANK_TRANSFER':
      return 'Bank Transfer';
    case 'POS_MACHINE':
      return 'POS Machine';
    case 'CREDIT_CARD':
      return 'Credit Card';
    case 'MOBILE_MONEY':
      return 'Mobile Money';
    case 'DEBT':
      return 'Debt Deposit';
    case 'SPLIT':
      return 'Split Payment';
    default:
      return method
        .split('_')
        .map(part => part.charAt(0) + part.slice(1).toLowerCase())
        .join(' ');
  }
}

function normalizeStatus(status?: string | null): string {
  return status?.toUpperCase() || 'UNKNOWN';
}

function getPeriodKey(date: Date, groupBy: FinanceGroupBy): string {
  if (groupBy === 'month') {
    return format(startOfMonth(date), 'yyyy-MM-dd');
  }

  if (groupBy === 'week') {
    return format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  }

  return format(date, 'yyyy-MM-dd');
}

function normalizeRequestedType(
  requestedType?: FinanceAggregationFilters['type']
): 'all' | 'income' | 'expense' {
  if (!requestedType) {
    return 'all';
  }

  return requestedType;
}

function matchesType(
  requestedType: FinanceAggregationFilters['type'],
  transactionType: FinanceTransactionType
): boolean {
  const normalizedRequestedType = normalizeRequestedType(requestedType);

  if (normalizedRequestedType === 'all') {
    return true;
  }

  return normalizedRequestedType.toUpperCase() === transactionType;
}

function matchesPaymentMethod(
  requestedMethod: string | undefined,
  paymentMethod: string | null
): boolean {
  if (!requestedMethod) {
    return true;
  }

  return normalizeFinancePaymentMethod(requestedMethod) === paymentMethod;
}

function matchesStatus(
  requestedStatus: string | undefined,
  transaction: NormalizedFinanceTransaction
): boolean {
  if (!requestedStatus || requestedStatus === 'ALL') {
    return true;
  }

  const normalizedRequestedStatus = normalizeStatus(requestedStatus);
  return (
    transaction.status === normalizedRequestedStatus ||
    transaction.paymentState === normalizedRequestedStatus
  );
}

function matchesSource(
  requestedSource: string | undefined,
  transaction: NormalizedFinanceTransaction
): boolean {
  if (!requestedSource || requestedSource === 'ALL') {
    return true;
  }

  return transaction.source === normalizeStatus(requestedSource);
}

function matchesEventType(
  requestedEventType: string | undefined,
  transaction: NormalizedFinanceTransaction
): boolean {
  if (!requestedEventType || requestedEventType === 'ALL') {
    return true;
  }

  return transaction.eventType === normalizeStatus(requestedEventType);
}

function matchesCashImpact(
  requestedCashImpact: string | undefined,
  transaction: NormalizedFinanceTransaction
): boolean {
  if (!requestedCashImpact || requestedCashImpact === 'ALL') {
    return true;
  }

  switch (requestedCashImpact.toLowerCase()) {
    case 'in':
      return transaction.cashIn > 0;
    case 'out':
      return transaction.cashOut > 0;
    case 'none':
      return transaction.cashIn === 0 && transaction.cashOut === 0;
    default:
      return true;
  }
}

function matchesProfitImpact(
  requestedProfitImpact: string | undefined,
  transaction: NormalizedFinanceTransaction
): boolean {
  if (!requestedProfitImpact || requestedProfitImpact === 'ALL') {
    return true;
  }

  switch (requestedProfitImpact.toLowerCase()) {
    case 'in':
      return transaction.profitIn > 0;
    case 'out':
      return transaction.profitOut > 0;
    case 'none':
      return transaction.profitIn === 0 && transaction.profitOut === 0;
    default:
      return true;
  }
}

function matchesPaymentState(
  requestedPaymentState: string | undefined,
  transaction: NormalizedFinanceTransaction
): boolean {
  if (!requestedPaymentState || requestedPaymentState === 'ALL') {
    return true;
  }

  return transaction.paymentState === normalizeStatus(requestedPaymentState);
}

function matchesSearch(
  search: string | undefined,
  transaction: NormalizedFinanceTransaction
): boolean {
  const normalizedSearch = normalizeText(search)?.toLowerCase();
  if (!normalizedSearch) {
    return true;
  }

  const searchableValues = [
    transaction.transactionNumber,
    transaction.displayLabel,
    transaction.description,
    transaction.categoryLabel,
    transaction.reference,
    transaction.customerName,
    transaction.vendorName,
    transaction.payerName,
    transaction.actorName,
    transaction.createdByName,
    transaction.eventType,
    transaction.source,
  ]
    .filter(Boolean)
    .map(value => String(value).toLowerCase());

  return searchableValues.some(value => value.includes(normalizedSearch));
}

function matchesDateRange(
  filters: Pick<FinanceAggregationFilters, 'startDate' | 'endDate'>,
  transaction: NormalizedFinanceTransaction
): boolean {
  if (filters.startDate && transaction.date < filters.startDate) {
    return false;
  }

  if (filters.endDate && transaction.date > filters.endDate) {
    return false;
  }

  return true;
}

function buildSourcePath(
  source: FinanceSource,
  sourceId: number,
  transactionType: FinanceTransactionType,
  reference: string | null
): string | null {
  if (source === 'MANUAL') {
    return `/finance/transactions/${sourceId}`;
  }

  if (source === 'POS') {
    const query = encodeURIComponent(reference || String(sourceId));
    return `/pos/history?search=${query}`;
  }

  if (source === 'STOCK') {
    const query = encodeURIComponent(reference || String(sourceId));
    return `/inventory/stock-history?search=${query}`;
  }

  return null;
}

function deriveLegacyType(
  cashIn: number,
  cashOut: number,
  profitIn: number,
  profitOut: number
): FinanceTransactionType {
  if (cashIn > 0 || profitIn > 0) {
    return FINANCIAL_TYPES.INCOME;
  }

  if (cashOut > 0 || profitOut > 0) {
    return FINANCIAL_TYPES.EXPENSE;
  }

  return FINANCIAL_TYPES.EXPENSE;
}

function buildLedgerNumericId(
  sourceModel: NormalizedFinanceTransaction['sourceModel'],
  sourceId: number
): number {
  const baseOffsets: Record<NormalizedFinanceTransaction['sourceModel'], number> = {
    FinancialTransaction: 0,
    StockAddition: 1_000_000,
    SalesTransaction: 2_000_000,
    TransactionPayment: 3_000_000,
    SplitPayment: 4_000_000,
  };

  return baseOffsets[sourceModel] + Number(sourceId || 0);
}

function createLedgerEvent(
  input: Omit<
    NormalizedFinanceTransaction,
    | 'id'
    | 'type'
    | 'rowId'
    | 'netCashImpact'
    | 'netProfitImpact'
    | 'netInventoryImpact'
    | 'netReceivableImpact'
    | 'sourcePath'
  > & {
    id?: string | number;
  }
): NormalizedFinanceTransaction {
  const type = deriveLegacyType(
    input.cashIn,
    input.cashOut,
    input.profitIn,
    input.profitOut
  );

  return {
    ...input,
    id: buildLedgerNumericId(input.sourceModel, input.sourceId),
    type,
    rowId: `${input.sourceModel}-${input.sourceId}-${input.eventType}`,
    sourcePath: buildSourcePath(
      input.source,
      input.sourceId,
      type,
      input.reference || input.transactionNumber
    ),
    netCashImpact: roundCurrency(input.cashIn - input.cashOut),
    netProfitImpact: roundCurrency(input.profitIn - input.profitOut),
    netInventoryImpact: roundCurrency(
      input.inventoryValueIn - input.inventoryValueOut
    ),
    netReceivableImpact: roundCurrency(
      input.receivableIncrease - input.receivableDecrease
    ),
  };
}

function normalizeSalePaymentState(
  paymentStatus: string | null | undefined,
  totalCollected: number,
  totalAmount: number
): string {
  const normalizedStatus = normalizeStatus(paymentStatus);

  if (normalizedStatus === 'CANCELLED' || normalizedStatus === 'REFUNDED') {
    return normalizedStatus;
  }

  const outstandingAmount = Math.max(
    0,
    roundCurrency(totalAmount - totalCollected)
  );

  if (outstandingAmount <= PAYMENT_TOLERANCE) {
    return 'PAID';
  }

  if (totalCollected > PAYMENT_TOLERANCE) {
    return 'PARTIAL';
  }

  return 'PENDING';
}

function estimateSaleCost(saleItems: Array<any>): {
  amount: number;
  estimated: boolean;
  estimatedReason?: string;
} {
  let estimatedCost = 0;
  let hasPhysicalGoods = false;
  let hasEstimatedCost = false;

  saleItems.forEach(item => {
    if (item.products?.isService) {
      return;
    }

    hasPhysicalGoods = true;

    if (item.total_cost !== null && typeof item.total_cost !== 'undefined') {
      estimatedCost += toAmount(item.total_cost);
      hasEstimatedCost = hasEstimatedCost || Boolean(item.cost_is_estimated);
      return;
    }

    if (item.unit_cost !== null && typeof item.unit_cost !== 'undefined') {
      estimatedCost += toAmount(item.unit_cost) * Number(item.quantity || 0);
      hasEstimatedCost = hasEstimatedCost || Boolean(item.cost_is_estimated);
      return;
    }

    estimatedCost += toAmount(item.products?.cost) * Number(item.quantity || 0);
    hasEstimatedCost = true;
  });

  return {
    amount: roundCurrency(estimatedCost),
    estimated: hasPhysicalGoods && hasEstimatedCost,
    estimatedReason:
      hasPhysicalGoods && hasEstimatedCost ? ESTIMATED_COGS_REASON : undefined,
  };
}

function getSaleCustomerName(sale: any): string {
  return (
    normalizeText(sale.customer?.name) ||
    normalizeText(sale.customer?.email) ||
    normalizeText(sale.customer?.phone) ||
    'Walk-in Customer'
  );
}

function shouldIgnoreSale(sale: any): boolean {
  return IGNORED_SALE_STATUSES.has(sale.payment_status);
}

function getSplitPaymentsSummary(splitPayments: Array<any>) {
  const normalizedPayments = splitPayments.map(payment => ({
    id: Number(payment.id),
    amount: roundCurrency(toAmount(payment.amount)),
    paymentMethod:
      normalizePaymentMethodForStorage(payment.payment_method) ||
      payment.payment_method,
    createdAt: payment.created_at || null,
  }));

  const nonDebtPayments = normalizedPayments.filter(
    payment => payment.paymentMethod !== 'debt'
  );
  const debtPayments = normalizedPayments.filter(
    payment => payment.paymentMethod === 'debt'
  );

  return {
    all: normalizedPayments,
    nonDebtPayments,
    debtPayments,
    nonDebtTotal: roundCurrency(
      nonDebtPayments.reduce((sum, payment) => sum + payment.amount, 0)
    ),
    debtTotal: roundCurrency(
      debtPayments.reduce((sum, payment) => sum + payment.amount, 0)
    ),
  };
}

function getLedgerPaymentsSummary(transactionPayments: Array<any>) {
  const payments = transactionPayments.map(payment => ({
    id: Number(payment.id),
    amount: roundCurrency(toAmount(payment.amount)),
    paymentMethod: payment.payment_method,
    paymentDate: payment.payment_date || payment.created_at || null,
    createdAt: payment.created_at || null,
    note: payment.note || null,
    recordedBy: payment.recordedBy || null,
  }));

  return {
    all: payments,
    total: roundCurrency(
      payments.reduce((sum, payment) => sum + payment.amount, 0)
    ),
  };
}

function buildManualLedgerEvent(transaction: any) {
  const amount = roundCurrency(toAmount(transaction.amount));
  const category =
    transaction.type === FINANCIAL_TYPES.INCOME
      ? transaction.incomeDetails?.incomeSource || 'OTHER'
      : transaction.expenseDetails?.expenseType || 'OTHER';

  const createdByName = getFinanceUserDisplayName(transaction.createdByUser);
  const flaggedOverlap =
    transaction.type === FINANCIAL_TYPES.INCOME
      ? isManualIncomeSourceBlocked(transaction.incomeDetails?.incomeSource)
      : isManualExpenseTypeBlocked(transaction.expenseDetails?.expenseType);

  const isOwnerFunding =
    transaction.type === FINANCIAL_TYPES.INCOME &&
    transaction.incomeDetails?.incomeSource === INCOME_SOURCES.INVESTMENTS;
  const eventType: FinanceEventType = isOwnerFunding
    ? 'OWNER_FUNDING_IN'
    : transaction.type === FINANCIAL_TYPES.INCOME
      ? 'MANUAL_OPERATING_INCOME'
      : 'MANUAL_OPERATING_EXPENSE';

  const paymentMethod = normalizeFinancePaymentMethod(transaction.paymentMethod);

  return createLedgerEvent({
    id: `manual-${transaction.id}`,
    source: 'MANUAL',
    sourceId: transaction.id,
    sourceModel: 'FinancialTransaction',
    eventType,
    displayLabel: isOwnerFunding
      ? 'Owner Funding'
      : transaction.type === FINANCIAL_TYPES.INCOME
        ? 'Manual Operating Income'
        : 'Manual Operating Expense',
    transactionNumber: transaction.transactionNumber,
    amount,
    date: transaction.transactionDate,
    paymentMethod,
    description:
      transaction.description ||
      (transaction.type === FINANCIAL_TYPES.INCOME
        ? 'Manual income entry'
        : 'Manual expense entry'),
    category,
    categoryLabel:
      transaction.type === FINANCIAL_TYPES.INCOME
        ? INCOME_SOURCE_LABELS[
            category as keyof typeof INCOME_SOURCE_LABELS
          ] || category
        : EXPENSE_TYPE_LABELS[
            category as keyof typeof EXPENSE_TYPE_LABELS
          ] || category,
    status: normalizeStatus(transaction.status),
    paymentState: null,
    cashIn: transaction.type === FINANCIAL_TYPES.INCOME ? amount : 0,
    cashOut: transaction.type === FINANCIAL_TYPES.EXPENSE ? amount : 0,
    profitIn:
      transaction.type === FINANCIAL_TYPES.INCOME && !isOwnerFunding
        ? amount
        : 0,
    profitOut: transaction.type === FINANCIAL_TYPES.EXPENSE ? amount : 0,
    inventoryValueIn: 0,
    inventoryValueOut: 0,
    receivableIncrease: 0,
    receivableDecrease: 0,
    createdBy: Number(transaction.createdBy) || null,
    createdByName,
    vendorName: transaction.expenseDetails?.vendorName,
    payerName: transaction.incomeDetails?.payerName,
    customerName: null,
    actorName:
      transaction.type === FINANCIAL_TYPES.INCOME
        ? transaction.incomeDetails?.payerName || createdByName
        : transaction.expenseDetails?.vendorName || createdByName,
    reference: transaction.transactionNumber,
    flaggedOverlap,
    editable: isFinancialTransactionMutable(transaction.status),
    estimated: false,
    estimatedReason: null,
  });
}

function buildStockPurchaseEvent(stockAddition: any) {
  const amount = roundCurrency(toAmount(stockAddition.totalCost));
  const productName = stockAddition.product?.name || 'Stock item';
  const supplierName = normalizeText(stockAddition.supplier?.name);

  return createLedgerEvent({
    id: `stock-${stockAddition.id}`,
    source: 'STOCK',
    sourceId: stockAddition.id,
    sourceModel: 'StockAddition',
    eventType: 'STOCK_PURCHASE',
    displayLabel: 'Stock Purchase',
    transactionNumber:
      stockAddition.referenceNo || `STOCK-${stockAddition.id}`,
    amount,
    date: stockAddition.purchaseDate || stockAddition.createdAt || new Date(),
    paymentMethod: null,
    description: `Stock purchase - ${productName}`,
    category: 'INVENTORY_PURCHASES',
    categoryLabel: 'Inventory Purchases',
    status: 'COMPLETED',
    paymentState: null,
    cashIn: 0,
    cashOut: amount,
    profitIn: 0,
    profitOut: 0,
    inventoryValueIn: amount,
    inventoryValueOut: 0,
    receivableIncrease: 0,
    receivableDecrease: 0,
    createdBy: Number(stockAddition.createdById) || null,
    createdByName: getFinanceUserDisplayName(stockAddition.createdBy),
    vendorName: supplierName,
    payerName: null,
    customerName: null,
    actorName: supplierName || getFinanceUserDisplayName(stockAddition.createdBy),
    reference: stockAddition.referenceNo || null,
    flaggedOverlap: false,
    editable: false,
    estimated: false,
    estimatedReason: null,
  });
}

function buildSaleLedgerEvents(sale: any): NormalizedFinanceTransaction[] {
  if (shouldIgnoreSale(sale)) {
    return [];
  }

  const totalAmount = roundCurrency(toAmount(sale.total_amount));
  if (totalAmount <= 0) {
    return [];
  }

  const splitPayments = getSplitPaymentsSummary(sale.split_payments || []);
  const ledgerPayments = getLedgerPaymentsSummary(sale.transaction_payments || []);
  const saleCreatedAt = sale.created_at ? new Date(sale.created_at) : new Date();
  const createdByName = getFinanceUserDisplayName(sale.users);
  const customerName = getSaleCustomerName(sale);
  const estimatedCost = estimateSaleCost(sale.sales_items || []);

  const normalizedPaymentMethod =
    normalizePaymentMethodForStorage(sale.payment_method) || sale.payment_method;
  const isSplitSale = normalizedPaymentMethod === 'split';
  const hasDebtBalance =
    normalizedPaymentMethod === 'debt' || splitPayments.debtTotal > 0;
  const initialLedgerPayments = ledgerPayments.all.filter(payment => {
    const paymentDate = payment.paymentDate
      ? new Date(payment.paymentDate)
      : payment.createdAt
        ? new Date(payment.createdAt)
        : null;

    if (!paymentDate) {
      return false;
    }

    return (
      Math.abs(paymentDate.getTime() - saleCreatedAt.getTime()) <=
      5 * 60 * 1000
    );
  });
  const laterLedgerPayments = ledgerPayments.all.filter(
    payment => !initialLedgerPayments.some(initial => initial.id === payment.id)
  );
  const saleDayCollections = roundCurrency(
    splitPayments.nonDebtTotal +
      initialLedgerPayments.reduce((sum, payment) => sum + payment.amount, 0)
  );
  const totalCollected = roundCurrency(
    splitPayments.nonDebtTotal + ledgerPayments.total
  );
  const receivableOpenedAtSale = Math.max(
    0,
    roundCurrency(totalAmount - saleDayCollections)
  );
  const outstandingAmount = Math.max(
    0,
    roundCurrency(totalAmount - totalCollected)
  );
  const paymentState = normalizeSalePaymentState(
    sale.payment_status,
    totalCollected,
    totalAmount
  );

  const baseMetadata = {
    customerId: sale.customer?.id || null,
    splitPayments: splitPayments.all.map(payment => ({
      id: payment.id,
      amount: payment.amount,
      paymentMethod: normalizeFinancePaymentMethod(payment.paymentMethod),
    })),
  };

  if (!hasDebtBalance && outstandingAmount <= PAYMENT_TOLERANCE) {
    return [
      createLedgerEvent({
        id: `sale-${sale.id}`,
        source: 'POS',
        sourceId: sale.id,
        sourceModel: 'SalesTransaction',
        eventType: 'POS_CASH_SALE',
        displayLabel: 'POS Cash Sale',
        transactionNumber: sale.transaction_number,
        amount: totalAmount,
        date: sale.created_at || new Date(),
        paymentMethod: normalizeFinancePaymentMethod(
          isSplitSale ? 'split' : normalizedPaymentMethod
        ),
        description: `POS sale - ${customerName}`,
        category: 'POS_SALES',
        categoryLabel: 'POS Sales',
        status: normalizeStatus(sale.payment_status || 'PAID'),
        paymentState,
        cashIn: totalAmount,
        cashOut: 0,
        profitIn: totalAmount,
        profitOut: estimatedCost.amount,
        inventoryValueIn: 0,
        inventoryValueOut: estimatedCost.amount,
        receivableIncrease: 0,
        receivableDecrease: 0,
        createdBy: Number(sale.user_id) || null,
        createdByName,
        vendorName: null,
        payerName: null,
        customerName,
        actorName: customerName,
        reference: sale.transaction_number,
        flaggedOverlap: false,
        editable: false,
        estimated: estimatedCost.estimated,
        estimatedReason: estimatedCost.estimatedReason || null,
        metadata: baseMetadata,
      }),
    ];
  }

  const events: NormalizedFinanceTransaction[] = [
    createLedgerEvent({
      id: `sale-issued-${sale.id}`,
      source: 'POS',
      sourceId: sale.id,
      sourceModel: 'SalesTransaction',
      eventType: 'POS_DEBT_SALE_ISSUED',
      displayLabel: 'Debt Sale Issued',
      transactionNumber: sale.transaction_number,
      amount: totalAmount,
      date: sale.created_at || new Date(),
      paymentMethod: normalizeFinancePaymentMethod(
        isSplitSale ? 'split' : normalizedPaymentMethod
      ),
      description: `Debt sale issued - ${customerName}`,
      category: 'POS_DEBT_SALES',
      categoryLabel: 'Debt Sales',
      status: normalizeStatus(sale.payment_status || paymentState),
      paymentState,
      cashIn: 0,
      cashOut: 0,
      profitIn: 0,
      profitOut: estimatedCost.amount,
      inventoryValueIn: 0,
      inventoryValueOut: estimatedCost.amount,
      receivableIncrease: receivableOpenedAtSale,
      receivableDecrease: 0,
      createdBy: Number(sale.user_id) || null,
      createdByName,
      vendorName: null,
      payerName: null,
      customerName,
      actorName: customerName,
      reference: sale.transaction_number,
      flaggedOverlap: false,
      editable: false,
      estimated: estimatedCost.estimated,
      estimatedReason: estimatedCost.estimatedReason || null,
      metadata: baseMetadata,
    }),
  ];

  splitPayments.nonDebtPayments.forEach(payment => {
    events.push(
      createLedgerEvent({
        id: `split-payment-${payment.id}`,
        source: 'POS',
        sourceId: payment.id,
        sourceModel: 'SplitPayment',
        eventType: 'POS_DEBT_PAYMENT_COLLECTED',
        displayLabel: 'Debt Payment Collected',
        transactionNumber: sale.transaction_number,
        amount: payment.amount,
        date: payment.createdAt || sale.created_at || new Date(),
        paymentMethod: normalizeFinancePaymentMethod(payment.paymentMethod),
        description: `Debt payment collected - ${customerName}`,
        category: 'POS_DEBT_COLLECTIONS',
        categoryLabel: 'Debt Collections',
        status: normalizeStatus(sale.payment_status || paymentState),
        paymentState,
        cashIn: payment.amount,
        cashOut: 0,
        profitIn: payment.amount,
        profitOut: 0,
        inventoryValueIn: 0,
        inventoryValueOut: 0,
        receivableIncrease: 0,
        receivableDecrease: 0,
        createdBy: Number(sale.user_id) || null,
        createdByName,
        vendorName: null,
        payerName: null,
        customerName,
        actorName: customerName,
        reference: sale.transaction_number,
        flaggedOverlap: false,
        editable: false,
        estimated: false,
        estimatedReason: null,
        metadata: {
          paymentSource: 'split',
        },
      })
    );
  });

  initialLedgerPayments.forEach(payment => {
    events.push(
      createLedgerEvent({
        id: `sale-day-payment-${payment.id}`,
        source: 'POS',
        sourceId: payment.id,
        sourceModel: 'TransactionPayment',
        eventType: 'POS_DEBT_PAYMENT_COLLECTED',
        displayLabel: 'Debt Payment Collected',
        transactionNumber: sale.transaction_number,
        amount: payment.amount,
        date:
          payment.paymentDate ||
          payment.createdAt ||
          sale.created_at ||
          new Date(),
        paymentMethod: normalizeFinancePaymentMethod(payment.paymentMethod),
        description: `Debt payment collected - ${customerName}`,
        category: 'POS_DEBT_COLLECTIONS',
        categoryLabel: 'Debt Collections',
        status: normalizeStatus(sale.payment_status || paymentState),
        paymentState,
        cashIn: payment.amount,
        cashOut: 0,
        profitIn: payment.amount,
        profitOut: 0,
        inventoryValueIn: 0,
        inventoryValueOut: 0,
        receivableIncrease: 0,
        receivableDecrease: 0,
        createdBy: Number(sale.user_id) || null,
        createdByName,
        vendorName: null,
        payerName: null,
        customerName,
        actorName: customerName,
        reference: sale.transaction_number,
        flaggedOverlap: false,
        editable: false,
        estimated: false,
        estimatedReason: null,
        metadata: {
          paymentSource: 'sale-day-payment',
        },
      })
    );
  });

  laterLedgerPayments.forEach(payment => {
    events.push(
      createLedgerEvent({
        id: `transaction-payment-${payment.id}`,
        source: 'POS',
        sourceId: payment.id,
        sourceModel: 'TransactionPayment',
        eventType: 'POS_DEBT_PAYMENT_COLLECTED',
        displayLabel: 'Debt Payment Collected',
        transactionNumber: sale.transaction_number,
        amount: payment.amount,
        date: payment.paymentDate || payment.createdAt || new Date(),
        paymentMethod: normalizeFinancePaymentMethod(payment.paymentMethod),
        description: `Debt payment collected - ${customerName}`,
        category: 'POS_DEBT_COLLECTIONS',
        categoryLabel: 'Debt Collections',
        status: normalizeStatus(sale.payment_status || paymentState),
        paymentState,
        cashIn: payment.amount,
        cashOut: 0,
        profitIn: payment.amount,
        profitOut: 0,
        inventoryValueIn: 0,
        inventoryValueOut: 0,
        receivableIncrease: 0,
        receivableDecrease: payment.amount,
        createdBy: Number(sale.user_id) || null,
        createdByName,
        vendorName: null,
        payerName: null,
        customerName,
        actorName: customerName,
        reference: sale.transaction_number,
        flaggedOverlap: false,
        editable: false,
        estimated: false,
        estimatedReason: null,
        metadata: {
          paymentSource: 'follow-up',
        },
      })
    );
  });

  return events;
}

async function fetchManualTransactions(
  filters: FinanceAggregationFilters,
  manualStatusMode: ManualStatusMode
) {
  const where: Record<string, unknown> = {};

  if (filters.startDate || filters.endDate) {
    where.transactionDate = {};
    if (filters.startDate) {
      (where.transactionDate as Record<string, Date>).gte = filters.startDate;
    }
    if (filters.endDate) {
      (where.transactionDate as Record<string, Date>).lte = filters.endDate;
    }
  }

  if (filters.status && filters.status !== 'ALL') {
    where.status = normalizeStatus(filters.status);
  } else if (manualStatusMode === 'reportable') {
    where.status = {
      in: [...REPORTABLE_MANUAL_FINANCE_STATUSES],
    };
  }

  return prisma.financialTransaction.findMany({
    where: where as any,
    select: {
      id: true,
      transactionNumber: true,
      type: true,
      amount: true,
      description: true,
      transactionDate: true,
      paymentMethod: true,
      status: true,
      createdBy: true,
      createdByUser: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      incomeDetails: {
        select: {
          incomeSource: true,
          payerName: true,
        },
      },
      expenseDetails: {
        select: {
          expenseType: true,
          vendorName: true,
        },
      },
    },
    orderBy: {
      transactionDate: 'desc',
    },
  });
}

async function fetchSalesTransactions(filters: FinanceAggregationFilters) {
  const where: Record<string, unknown> = {
    transaction_type: 'sale',
    payment_status: {
      notIn: ['CANCELLED', 'REFUNDED', 'cancelled', 'refunded'],
    },
  };

  if (filters.startDate || filters.endDate) {
    const createdAt: Record<string, Date> = {};
    const paymentDate: Record<string, Date> = {};
    const paymentCreatedAt: Record<string, Date> = {};

    if (filters.startDate) {
      createdAt.gte = filters.startDate;
      paymentDate.gte = filters.startDate;
      paymentCreatedAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      createdAt.lte = filters.endDate;
      paymentDate.lte = filters.endDate;
      paymentCreatedAt.lte = filters.endDate;
    }

    where.OR = [
      {
        created_at: createdAt,
      },
      {
        transaction_payments: {
          some: {
            OR: [
              {
                payment_date: paymentDate,
              },
              {
                payment_date: null,
                created_at: paymentCreatedAt,
              },
            ],
          },
        },
      },
    ];
  }

  const transactionPaymentsInclude: any = {
    select: {
      id: true,
      amount: true,
      payment_method: true,
      payment_date: true,
      note: true,
      created_at: true,
      recordedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  };

  if (filters.startDate || filters.endDate) {
    const dateRange = {
      ...(filters.startDate ? { gte: filters.startDate } : {}),
      ...(filters.endDate ? { lte: filters.endDate } : {}),
    };

    transactionPaymentsInclude.where = {
      OR: [
        {
          payment_date: dateRange,
        },
        {
          payment_date: null,
          created_at: dateRange,
        },
      ],
    };
  }

  return prisma.salesTransaction.findMany({
    where: where as any,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      users: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      sales_items: {
        select: {
          quantity: true,
          unit_price: true,
          total_price: true,
          unit_cost: true,
          total_cost: true,
          cost_is_estimated: true,
          products: {
            select: {
              name: true,
              cost: true,
              isService: true,
            },
          },
        },
      },
      split_payments: {
        select: {
          id: true,
          amount: true,
          payment_method: true,
          created_at: true,
        },
      },
      transaction_payments: transactionPaymentsInclude,
    } as any,
    orderBy: {
      created_at: 'desc',
    },
  });
}

async function fetchStockAdditions(filters: FinanceAggregationFilters) {
  const where: Record<string, unknown> = {};

  if (filters.startDate || filters.endDate) {
    where.purchaseDate = {};
    if (filters.startDate) {
      (where.purchaseDate as Record<string, Date>).gte = filters.startDate;
    }
    if (filters.endDate) {
      (where.purchaseDate as Record<string, Date>).lte = filters.endDate;
    }
  }

  return prisma.stockAddition.findMany({
    where: where as any,
    select: {
      id: true,
      totalCost: true,
      purchaseDate: true,
      createdAt: true,
      referenceNo: true,
      createdById: true,
      createdBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      product: {
        select: {
          name: true,
        },
      },
      supplier: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      purchaseDate: 'desc',
    },
  });
}

export async function getNormalizedFinanceTransactions(
  filters: FinanceAggregationFilters,
  options?: {
    includeFlaggedOverlaps?: boolean;
    limit?: number;
    manualStatusMode?: ManualStatusMode;
  }
): Promise<NormalizedFinanceTransaction[]> {
  const {
    includeFlaggedOverlaps = false,
    limit,
    manualStatusMode = 'reportable',
  } = options ?? {};

  const sourceFilter = normalizeStatus(filters.source || 'ALL');
  const includeManual = sourceFilter === 'ALL' || sourceFilter === 'MANUAL';
  const includeSales = sourceFilter === 'ALL' || sourceFilter === 'POS';
  const includeStock = sourceFilter === 'ALL' || sourceFilter === 'STOCK';

  const [manualTransactions, salesTransactions, stockAdditions] =
    await Promise.all([
      includeManual
        ? fetchManualTransactions(filters, manualStatusMode)
        : Promise.resolve([]),
      includeSales ? fetchSalesTransactions(filters) : Promise.resolve([]),
      includeStock ? fetchStockAdditions(filters) : Promise.resolve([]),
    ]);

  const transactions = [
    ...manualTransactions.map(buildManualLedgerEvent),
    ...salesTransactions.flatMap(buildSaleLedgerEvents),
    ...stockAdditions.map(buildStockPurchaseEvent),
  ]
    .filter(transaction =>
      includeFlaggedOverlaps ? true : !transaction.flaggedOverlap
    )
    .filter(transaction => matchesDateRange(filters, transaction))
    .filter(transaction => matchesType(filters.type, transaction.type))
    .filter(transaction => matchesPaymentMethod(filters.paymentMethod, transaction.paymentMethod))
    .filter(transaction => matchesStatus(filters.status, transaction))
    .filter(transaction => matchesSource(filters.source, transaction))
    .filter(transaction => matchesEventType(filters.eventType, transaction))
    .filter(transaction => matchesCashImpact(filters.cashImpact, transaction))
    .filter(transaction => matchesProfitImpact(filters.profitImpact, transaction))
    .filter(transaction => matchesPaymentState(filters.paymentState, transaction))
    .filter(transaction => matchesSearch(filters.search, transaction))
    .sort((left, right) => right.date.getTime() - left.date.getTime());

  return typeof limit === 'number' ? transactions.slice(0, limit) : transactions;
}

export function summarizeFinanceTransactions(
  transactions: NormalizedFinanceTransaction[]
): FinanceSummaryTotals {
  const paymentMethodMap = new Map<string, { count: number; amount: number }>();
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalValue = 0;

  transactions.forEach(transaction => {
    totalIncome += transaction.profitIn;
    totalExpenses += transaction.profitOut;
    totalValue += transaction.amount;

    if (transaction.paymentMethod) {
      const current = paymentMethodMap.get(transaction.paymentMethod) || {
        count: 0,
        amount: 0,
      };

      paymentMethodMap.set(transaction.paymentMethod, {
        count: current.count + 1,
        amount: current.amount + transaction.amount,
      });
    }
  });

  const topPaymentMethod = Array.from(paymentMethodMap.entries()).sort(
    (left, right) => right[1].count - left[1].count
  )[0]?.[0];

  return {
    totalIncome: roundCurrency(totalIncome),
    totalExpenses: roundCurrency(totalExpenses),
    netProfit: roundCurrency(totalIncome - totalExpenses),
    totalTransactions: transactions.length,
    averageTransactionValue:
      transactions.length > 0 ? roundCurrency(totalValue / transactions.length) : 0,
    topPaymentMethod: displayPaymentMethod(topPaymentMethod),
  };
}

export function buildPaymentMethodDistribution(
  transactions: NormalizedFinanceTransaction[]
): Array<{ method: string; count: number; amount: number }> {
  const paymentMethodMap = new Map<string, { count: number; amount: number }>();

  transactions.forEach(transaction => {
    if (!transaction.paymentMethod) {
      return;
    }

    const current = paymentMethodMap.get(transaction.paymentMethod) || {
      count: 0,
      amount: 0,
    };

    paymentMethodMap.set(transaction.paymentMethod, {
      count: current.count + 1,
      amount:
        current.amount +
        (transaction.cashIn > 0
          ? transaction.cashIn
          : transaction.cashOut > 0
            ? transaction.cashOut
            : transaction.amount),
    });
  });

  return Array.from(paymentMethodMap.entries()).map(([method, values]) => ({
    method,
    count: values.count,
    amount: roundCurrency(values.amount),
  }));
}

export function buildFinanceTrends(
  transactions: NormalizedFinanceTransaction[],
  groupBy: FinanceGroupBy = 'day'
): Array<{
  date: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  transactions: number;
}> {
  const trendMap = new Map<
    string,
    { revenue: number; expenses: number; transactions: number }
  >();

  transactions.forEach(transaction => {
    const key = getPeriodKey(transaction.date, groupBy);
    const current = trendMap.get(key) || {
      revenue: 0,
      expenses: 0,
      transactions: 0,
    };

    current.revenue += transaction.profitIn;
    current.expenses += transaction.profitOut;
    current.transactions += 1;
    trendMap.set(key, current);
  });

  return Array.from(trendMap.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([date, values]) => ({
      date,
      revenue: roundCurrency(values.revenue),
      expenses: roundCurrency(values.expenses),
      netProfit: roundCurrency(values.revenue - values.expenses),
      transactions: values.transactions,
    }));
}

export function buildExpenseBreakdown(
  transactions: NormalizedFinanceTransaction[]
): Record<string, number> {
  const breakdown = new Map<string, number>();

  transactions
    .filter(transaction => transaction.profitOut > 0)
    .forEach(transaction => {
      const key =
        transaction.eventType === 'POS_CASH_SALE' ||
        transaction.eventType === 'POS_DEBT_SALE_ISSUED'
          ? 'COST_OF_GOODS_SOLD'
          : transaction.category;

      breakdown.set(key, roundCurrency((breakdown.get(key) || 0) + transaction.profitOut));
    });

  return Object.fromEntries(breakdown.entries());
}

export function buildTopExpenseVendors(
  transactions: NormalizedFinanceTransaction[],
  limit = 10
): Array<{ vendor: string; amount: number; category: string }> {
  const vendorMap = new Map<string, { amount: number; category: string }>();

  transactions
    .filter(transaction => transaction.cashOut > 0)
    .filter(transaction => Boolean(transaction.vendorName))
    .forEach(transaction => {
      const vendorName = transaction.vendorName || 'Unknown Vendor';
      const current = vendorMap.get(vendorName) || {
        amount: 0,
        category: transaction.category,
      };

      vendorMap.set(vendorName, {
        amount: roundCurrency(current.amount + transaction.cashOut),
        category: current.category,
      });
    });

  return Array.from(vendorMap.entries())
    .map(([vendor, data]) => ({
      vendor,
      amount: data.amount,
      category: data.category,
    }))
    .sort((left, right) => right.amount - left.amount)
    .slice(0, limit);
}

function buildTradingSummary(
  transactions: NormalizedFinanceTransaction[]
): FinanceTradingSummary {
  let salesRevenue = 0;
  let manualOperatingIncome = 0;
  let costOfGoodsSold = 0;
  let operatingExpenses = 0;

  transactions.forEach(transaction => {
    if (
      transaction.eventType === 'POS_CASH_SALE' ||
      transaction.eventType === 'POS_DEBT_PAYMENT_COLLECTED'
    ) {
      salesRevenue += transaction.profitIn;
    }

    if (transaction.eventType === 'MANUAL_OPERATING_INCOME') {
      manualOperatingIncome += transaction.profitIn;
    }

    if (
      transaction.eventType === 'POS_CASH_SALE' ||
      transaction.eventType === 'POS_DEBT_SALE_ISSUED'
    ) {
      costOfGoodsSold += transaction.profitOut;
    }

    if (transaction.eventType === 'MANUAL_OPERATING_EXPENSE') {
      operatingExpenses += transaction.profitOut;
    }
  });

  const operatingRevenue = salesRevenue + manualOperatingIncome;
  const grossProfit = operatingRevenue - costOfGoodsSold;
  const netProfit = grossProfit - operatingExpenses;

  return {
    salesRevenue: roundCurrency(salesRevenue),
    manualOperatingIncome: roundCurrency(manualOperatingIncome),
    operatingRevenue: roundCurrency(operatingRevenue),
    costOfGoodsSold: roundCurrency(costOfGoodsSold),
    operatingExpenses: roundCurrency(operatingExpenses),
    grossProfit: roundCurrency(grossProfit),
    netProfit: roundCurrency(netProfit),
  };
}

function buildCashMovementSummary(
  transactions: NormalizedFinanceTransaction[]
): FinanceCashMovementSummary {
  let cashReceived = 0;
  let cashSpent = 0;
  let customerCollections = 0;
  let ownerFunding = 0;
  let stockPurchases = 0;
  let operatingExpensePayments = 0;
  let manualIncomeCollections = 0;

  transactions.forEach(transaction => {
    cashReceived += transaction.cashIn;
    cashSpent += transaction.cashOut;

    if (
      transaction.eventType === 'POS_CASH_SALE' ||
      transaction.eventType === 'POS_DEBT_PAYMENT_COLLECTED'
    ) {
      customerCollections += transaction.cashIn;
    }

    if (transaction.eventType === 'OWNER_FUNDING_IN') {
      ownerFunding += transaction.cashIn;
    }

    if (transaction.eventType === 'STOCK_PURCHASE') {
      stockPurchases += transaction.cashOut;
    }

    if (transaction.eventType === 'MANUAL_OPERATING_EXPENSE') {
      operatingExpensePayments += transaction.cashOut;
    }

    if (transaction.eventType === 'MANUAL_OPERATING_INCOME') {
      manualIncomeCollections += transaction.cashIn;
    }
  });

  return {
    cashReceived: roundCurrency(cashReceived),
    cashSpent: roundCurrency(cashSpent),
    customerCollections: roundCurrency(customerCollections),
    ownerFunding: roundCurrency(ownerFunding),
    stockPurchases: roundCurrency(stockPurchases),
    operatingExpensePayments: roundCurrency(operatingExpensePayments),
    manualIncomeCollections: roundCurrency(manualIncomeCollections),
    netCashMovement: roundCurrency(cashReceived - cashSpent),
  };
}

async function getInventorySnapshot(asOfDate?: Date) {
  const effectiveDate = asOfDate || new Date();
  const now = new Date();
  const includeHistoricalAdjustments =
    !isSameDay(effectiveDate, now) &&
    effectiveDate.getTime() < now.getTime();

  const productSelect: any = {
    id: true,
    name: true,
    stock: true,
    cost: true,
  };

  if (includeHistoricalAdjustments) {
    productSelect.stockTransactions = {
      where: {
        createdAt: {
          gt: effectiveDate,
        },
      },
      select: {
        quantity: true,
      },
    };
  }

  const productQuery: any = {
    where: {
      isService: false,
    },
    select: productSelect,
  };

  const products = (await prisma.product.findMany(productQuery)) as Array<{
    id: number;
    name: string;
    stock: number;
    cost: unknown;
    stockTransactions?: Array<{ quantity: number }>;
  }>;

  let inventoryUnitsOnHand = 0;
  let inventoryValueOnHand = 0;

  products.forEach(product => {
    const currentStock = Number(product.stock || 0);
    const reversalQuantity = includeHistoricalAdjustments
      ? (product.stockTransactions || []).reduce(
          (sum: number, item: { quantity: number }) => sum + Number(item.quantity || 0),
          0
        )
      : 0;
    const stockAsOfDate = Math.max(0, currentStock - reversalQuantity);

    inventoryUnitsOnHand += stockAsOfDate;
    inventoryValueOnHand += stockAsOfDate * toAmount(product.cost);
  });

  return {
    inventoryUnitsOnHand,
    inventoryValueOnHand: roundCurrency(inventoryValueOnHand),
    inventorySkusTracked: products.length,
    estimated: includeHistoricalAdjustments,
    estimatedReason: includeHistoricalAdjustments
      ? ESTIMATED_INVENTORY_REASON
      : null,
  };
}

export async function getReceivablesSnapshot(options?: {
  asOfDate?: Date;
  agingStartDate?: Date;
}): Promise<ReceivablesSnapshot> {
  const asOfDate = options?.asOfDate || new Date();
  const agingStartDate = options?.agingStartDate;

  const sales = (await prisma.salesTransaction.findMany({
    where: {
      transaction_type: 'sale',
      created_at: {
        lte: asOfDate,
      },
      payment_status: {
        notIn: ['CANCELLED', 'REFUNDED', 'cancelled', 'refunded'],
      },
    } as any,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      users: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      split_payments: {
        select: {
          amount: true,
          payment_method: true,
        },
      },
      transaction_payments: {
        select: {
          amount: true,
          payment_date: true,
          payment_method: true,
        },
      },
    } as any,
    orderBy: {
      created_at: 'asc',
    },
  })) as any[];

  const receivables = sales
    .map(sale => {
      const totalAmount = roundCurrency(toAmount(sale.total_amount));
      const splitPaidAmount = (sale.split_payments || []).reduce(
        (sum: number, payment: any) => {
          const paymentMethod =
            normalizePaymentMethodForStorage(payment.payment_method) ||
            payment.payment_method;
          if (paymentMethod === 'debt') {
            return sum;
          }

          return sum + toAmount(payment.amount);
        },
        0
      );
      const ledgerPaidAmount = (sale.transaction_payments || []).reduce(
        (sum: number, payment: any) => {
          const paymentDate = payment.payment_date
            ? new Date(payment.payment_date)
            : null;
          if (paymentDate && paymentDate.getTime() > asOfDate.getTime()) {
            return sum;
          }

          return sum + toAmount(payment.amount);
        },
        0
      );
      const paidAmount = roundCurrency(splitPaidAmount + ledgerPaidAmount);
      const outstandingAmount = Math.max(
        0,
        roundCurrency(totalAmount - paidAmount)
      );

      if (outstandingAmount <= PAYMENT_TOLERANCE) {
        return null;
      }

      const saleDate = sale.created_at || new Date();
      if (agingStartDate && saleDate.getTime() < agingStartDate.getTime()) {
        return null;
      }

      const daysOutstanding = Math.max(
        0,
        Math.floor(
          (asOfDate.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      );

      let agingBucket: '0-30' | '31-60' | '61-90' | '90+';
      if (daysOutstanding <= 30) {
        agingBucket = '0-30';
      } else if (daysOutstanding <= 60) {
        agingBucket = '31-60';
      } else if (daysOutstanding <= 90) {
        agingBucket = '61-90';
      } else {
        agingBucket = '90+';
      }

      return {
        id: sale.id,
        transactionNumber: sale.transaction_number,
        customer: sale.customer || { name: 'Walk-in Customer' },
        saleDate,
        totalAmount,
        paidAmount,
        outstandingAmount,
        daysOutstanding,
        agingBucket,
        paymentStatus: normalizeSalePaymentState(
          sale.payment_status,
          paidAmount,
          totalAmount
        ),
        createdBy: sale.users,
        payments: (sale.transaction_payments || []).map((payment: any) => ({
          amount: roundCurrency(toAmount(payment.amount)),
          paymentDate: payment.payment_date || null,
          paymentMethod: payment.payment_method,
        })),
      };
    })
    .filter(Boolean) as ReceivablesSnapshot['receivables'];

  const customerIds = new Set(
    receivables.map(receivable => receivable.customer?.id || receivable.transactionNumber)
  );
  const totalOutstanding = receivables.reduce(
    (sum, receivable) => sum + receivable.outstandingAmount,
    0
  );
  const averageDaysOutstanding =
    receivables.length > 0
      ? receivables.reduce(
          (sum, receivable) => sum + receivable.daysOutstanding,
          0
        ) / receivables.length
      : 0;

  return {
    receivables,
    summary: {
      totalOutstanding: roundCurrency(totalOutstanding),
      totalTransactions: receivables.length,
      averageDaysOutstanding: Math.round(averageDaysOutstanding),
      customersWithBalances: customerIds.size,
    },
  };
}

async function buildBusinessPositionSummary(
  asOfDate?: Date
): Promise<FinanceBusinessPositionSummary> {
  const [inventorySnapshot, receivablesSnapshot] = await Promise.all([
    getInventorySnapshot(asOfDate),
    getReceivablesSnapshot({ asOfDate }),
  ]);

  const estimatedReasons = [
    ...(inventorySnapshot.estimatedReason
      ? [inventorySnapshot.estimatedReason]
      : []),
  ];

  return {
    inventoryValueOnHand: inventorySnapshot.inventoryValueOnHand,
    inventoryUnitsOnHand: inventorySnapshot.inventoryUnitsOnHand,
    inventorySkusTracked: inventorySnapshot.inventorySkusTracked,
    receivablesOutstanding: receivablesSnapshot.summary.totalOutstanding,
    receivableTransactions: receivablesSnapshot.summary.totalTransactions,
    customersWithBalances: receivablesSnapshot.summary.customersWithBalances,
    estimated: inventorySnapshot.estimated,
    estimatedReasons,
  };
}

function buildMethodology(
  transactions: NormalizedFinanceTransaction[],
  businessPosition: FinanceBusinessPositionSummary
): FinanceMethodology {
  const reasons = new Set<string>();

  transactions.forEach(transaction => {
    if (transaction.estimated && transaction.estimatedReason) {
      reasons.add(transaction.estimatedReason);
    }
  });

  businessPosition.estimatedReasons.forEach(reason => reasons.add(reason));

  return {
    status: reasons.size > 0 ? 'estimated' : 'exact',
    estimated: reasons.size > 0,
    rebuiltFromOperationalData: true,
    historicalRebuild: 'best_effort',
    reasons: Array.from(reasons),
  };
}

export async function getFinanceAggregate(
  filters: FinanceAggregationFilters,
  options?: {
    groupBy?: FinanceGroupBy;
    includeFlaggedOverlaps?: boolean;
    limit?: number;
  }
): Promise<FinanceAggregateResult> {
  const transactions = await getNormalizedFinanceTransactions(filters, {
    includeFlaggedOverlaps: options?.includeFlaggedOverlaps,
    limit: options?.limit,
    manualStatusMode: 'reportable',
  });

  const [businessPosition] = await Promise.all([
    buildBusinessPositionSummary(filters.endDate),
  ]);

  const summary = summarizeFinanceTransactions(transactions);
  const trading = buildTradingSummary(transactions);
  const cashMovement = buildCashMovementSummary(transactions);
  const methodology = buildMethodology(transactions, businessPosition);

  return {
    transactions,
    summary,
    paymentMethodDistribution: buildPaymentMethodDistribution(transactions),
    dailyTrends: buildFinanceTrends(transactions, options?.groupBy),
    expenseBreakdown: buildExpenseBreakdown(transactions),
    topVendors: buildTopExpenseVendors(transactions),
    trading,
    cashMovement,
    businessPosition,
    methodology,
  };
}

export async function getRecentFinanceTransactions(limit = 10) {
  return getNormalizedFinanceTransactions(
    {},
    {
      limit,
      includeFlaggedOverlaps: true,
      manualStatusMode: 'all',
    }
  );
}

export async function getManualFinanceOverlapEntries(
  range?: Partial<FinanceRange>
): Promise<FinanceOverlapEntry[]> {
  const where: Record<string, unknown> = {};

  if (range?.startDate || range?.endDate) {
    where.transactionDate = {};
    if (range.startDate) {
      (where.transactionDate as Record<string, Date>).gte = range.startDate;
    }
    if (range.endDate) {
      (where.transactionDate as Record<string, Date>).lte = range.endDate;
    }
  }

  const transactions = await prisma.financialTransaction.findMany({
    where: where as any,
    select: {
      id: true,
      transactionNumber: true,
      type: true,
      amount: true,
      description: true,
      transactionDate: true,
      status: true,
      createdByUser: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      incomeDetails: {
        select: {
          incomeSource: true,
        },
      },
      expenseDetails: {
        select: {
          expenseType: true,
        },
      },
    },
    orderBy: {
      transactionDate: 'desc',
    },
  });

  return transactions
    .filter(transaction => {
      if (transaction.type === FINANCIAL_TYPES.INCOME) {
        return isManualIncomeSourceBlocked(transaction.incomeDetails?.incomeSource);
      }

      return isManualExpenseTypeBlocked(transaction.expenseDetails?.expenseType);
    })
    .map(transaction => {
      const category =
        transaction.type === FINANCIAL_TYPES.INCOME
          ? transaction.incomeDetails?.incomeSource || 'OTHER'
          : transaction.expenseDetails?.expenseType || 'OTHER';

      return {
        id: transaction.id,
        transactionNumber: transaction.transactionNumber,
        type: transaction.type as FinanceTransactionType,
        amount: roundCurrency(toAmount(transaction.amount)),
        transactionDate: transaction.transactionDate,
        description: transaction.description,
        status: transaction.status,
        category,
        categoryLabel:
          transaction.type === FINANCIAL_TYPES.INCOME
            ? INCOME_SOURCE_LABELS[
                category as keyof typeof INCOME_SOURCE_LABELS
              ] || category
            : EXPENSE_TYPE_LABELS[
                category as keyof typeof EXPENSE_TYPE_LABELS
              ] || category,
        createdBy: transaction.createdByUser,
      };
    });
}

export { buildFinanceRange, getPreviousFinanceRange };
export type { FinanceRange };
