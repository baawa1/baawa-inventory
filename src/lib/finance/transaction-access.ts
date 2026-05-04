interface FinanceTransactionActor {
  firstName?: string | null;
  lastName?: string | null;
}

interface FinanceTransactionAccessShape {
  createdBy?: number | string | null;
  status?: string | null;
}

interface FinanceTransactionRecordWithActors {
  createdByUser?: FinanceTransactionActor | null;
  approvedByUser?: FinanceTransactionActor | null;
}

export function getFinanceUserDisplayName(
  actor?: FinanceTransactionActor | null
): string | undefined {
  if (!actor) {
    return undefined;
  }

  const fullName = [actor.firstName, actor.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return fullName || undefined;
}

export function isFinancialTransactionMutable(status?: string | null): boolean {
  return ['PENDING', 'COMPLETED'].includes(status ?? '');
}

export function canUserEditFinancialTransaction(
  role: string | null | undefined,
  userId: number | string,
  transaction: FinanceTransactionAccessShape
): boolean {
  const isMutable = isFinancialTransactionMutable(transaction.status);

  if (role === 'ADMIN') {
    return isMutable;
  }

  if (role !== 'MANAGER') {
    return false;
  }

  return isMutable && Number(userId) === Number(transaction.createdBy);
}

export function attachFinancialTransactionNames<
  T extends FinanceTransactionRecordWithActors,
>(transaction: T): T & {
  createdByName?: string;
  approvedByName?: string;
} {
  return {
    ...transaction,
    createdByName:
      getFinanceUserDisplayName(transaction.createdByUser) ||
      (transaction as { createdByName?: string }).createdByName,
    approvedByName:
      getFinanceUserDisplayName(transaction.approvedByUser) ||
      (transaction as { approvedByName?: string }).approvedByName,
  };
}
