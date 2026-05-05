'use client';

import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { formatCurrency } from '@/lib/utils';
import type { FinancialTransaction } from '@/types/finance';
import {
  getPaymentMethodLabel,
  PaymentMethodIcon,
} from './PaymentMethodIcon';
import { TransactionStatusBadge } from './TransactionStatusBadge';

function formatPersonName(
  person?: FinancialTransaction['createdByUser'] | FinancialTransaction['approvedByUser']
) {
  if (!person) {
    return 'N/A';
  }

  const fullName = `${person.firstName} ${person.lastName}`.trim();
  return fullName || person.email;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <p className="text-muted-foreground text-xs uppercase tracking-wide">
        {label}
      </p>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-lg border p-4">
      <p className="text-sm font-semibold">{title}</p>
      {children}
    </section>
  );
}

export function ManualTransactionDetailDialog({
  transaction,
}: {
  transaction: FinancialTransaction;
}) {
  const isIncome = transaction.type === 'INCOME';
  const detailTitle = isIncome ? 'Income Details' : 'Expense Details';
  const detailTypeLabel = isIncome ? 'Income Source' : 'Expense Type';
  const detailTypeValue = isIncome
    ? transaction.incomeDetails?.incomeSource
    : transaction.expenseDetails?.expenseType;
  const counterpartyLabel = isIncome ? 'Payer' : 'Vendor';
  const counterpartyValue = isIncome
    ? transaction.incomeDetails?.payerName
    : transaction.expenseDetails?.vendorName;
  const amountClass = isIncome ? 'text-green-600' : 'text-red-600';
  const signedAmount = `${isIncome ? '+' : '-'}${formatCurrency(transaction.amount)}`;
  const createdByName = formatPersonName(transaction.createdByUser);

  return (
    <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {isIncome ? 'Income Details' : 'Expense Details'} -{' '}
          {transaction.transactionNumber}
        </DialogTitle>
      </DialogHeader>

      <div className="grid gap-4 text-sm">
        <DetailSection title={isIncome ? 'Income Transaction' : 'Expense Transaction'}>
          <div className="space-y-2">
            <p className={`text-2xl font-semibold ${amountClass}`}>{signedAmount}</p>
            <p className="text-muted-foreground">
              {transaction.description || 'No description provided.'}
            </p>
          </div>
        </DetailSection>

        <DetailSection title="Summary">
          <div className="grid gap-3 md:grid-cols-2">
            <DetailItem label="Amount" value={<span className={amountClass}>{signedAmount}</span>} />
            <DetailItem
              label="Date"
              value={format(new Date(transaction.transactionDate), 'PPP p')}
            />
            <DetailItem
              label="Status"
              value={<TransactionStatusBadge status={transaction.status} className="w-fit" />}
            />
            <DetailItem
              label="Payment Method"
              value={
                transaction.paymentMethod ? (
                  <span className="inline-flex items-center gap-2">
                    <PaymentMethodIcon method={transaction.paymentMethod} />
                    <span>{getPaymentMethodLabel(transaction.paymentMethod)}</span>
                  </span>
                ) : (
                  getPaymentMethodLabel(transaction.paymentMethod)
                )
              }
            />
          </div>
        </DetailSection>

        <DetailSection title="Transaction Information">
          <div className="grid gap-3 md:grid-cols-2">
            <DetailItem
              label="Reference"
              value={<span className="font-mono">{transaction.transactionNumber}</span>}
            />
            <DetailItem label="Transaction Type" value={isIncome ? 'Income' : 'Expense'} />
          </div>
        </DetailSection>

        <DetailSection title={detailTitle}>
          <div className="grid gap-3 md:grid-cols-2">
            <DetailItem label={detailTypeLabel} value={detailTypeValue || 'N/A'} />
            <DetailItem label={counterpartyLabel} value={counterpartyValue || 'N/A'} />
          </div>
        </DetailSection>

        <DetailSection title="Audit Trail">
          <div className="grid gap-3 md:grid-cols-2">
            <DetailItem label="Created By" value={createdByName} />
            <DetailItem
              label="Created At"
              value={format(new Date(transaction.createdAt), 'PPP p')}
            />
          </div>
          <p className="text-muted-foreground text-sm">{transaction.createdByUser.email}</p>
        </DetailSection>
      </div>
    </DialogContent>
  );
}
