#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const APPLY = process.argv.includes('--apply');
const PAYMENT_TOLERANCE = 0.01;

const SUCCESS_STATUSES = new Set(['paid', 'completed']);

function normalizePaymentMethod(method) {
  if (!method) return '';
  const normalized = String(method).toLowerCase().trim();

  switch (normalized) {
    case 'pos_machine':
      return 'pos';
    case 'bank':
      return 'bank_transfer';
    case 'mobile':
      return 'mobile_money';
    case 'credit_card':
      return 'pos';
    default:
      return normalized;
  }
}

function isSuccessfulStatus(status) {
  if (!status) return false;
  return SUCCESS_STATUSES.has(String(status).toLowerCase().trim());
}

async function main() {
  console.log('Backfill POS payment records');
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN'}`);

  const transactions = await prisma.salesTransaction.findMany({
    where: {
      payment_status: { in: ['PAID', 'COMPLETED', 'paid', 'completed'] },
    },
    include: {
      split_payments: true,
      transaction_payments: true,
    },
  });

  const candidates = transactions.filter(transaction => {
    if (!isSuccessfulStatus(transaction.payment_status)) {
      return false;
    }

    const method = normalizePaymentMethod(transaction.payment_method);
    if (method === 'split' || method === 'debt') {
      return false;
    }

    const splitPaid = (transaction.split_payments || []).reduce(
      (sum, payment) => {
        const paymentMethod = normalizePaymentMethod(payment.payment_method);
        if (paymentMethod === 'debt') {
          return sum;
        }
        return sum + Number(payment.amount || 0);
      },
      0
    );

    const ledgerPaid = (transaction.transaction_payments || []).reduce(
      (sum, payment) => sum + Number(payment.amount || 0),
      0
    );

    const totalPaid = splitPaid + ledgerPaid;
    return totalPaid <= PAYMENT_TOLERANCE;
  });

  console.log(`Candidate transactions: ${candidates.length}`);

  if (candidates.length > 0) {
    console.log('Sample transaction IDs:', candidates.slice(0, 20).map(t => t.id).join(', '));
  }

  if (!APPLY) {
    console.log('Dry run complete. Re-run with --apply to write changes.');
    return;
  }

  if (candidates.length === 0) {
    console.log('No records to backfill.');
    return;
  }

  const data = candidates.map(transaction => ({
    transaction_id: transaction.id,
    amount: transaction.total_amount,
    payment_method: normalizePaymentMethod(transaction.payment_method),
    note: 'Backfilled full payment',
    payment_date: transaction.created_at || new Date(),
    recorded_by: null,
  }));

  const result = await prisma.transactionPayment.createMany({
    data,
  });

  console.log(`Inserted ${result.count} transaction_payment rows.`);
}

main()
  .catch(error => {
    console.error('Backfill failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
