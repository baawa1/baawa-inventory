const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  pos: 'POS Machine',
  bank_transfer: 'Bank Transfer',
  bank: 'Bank Transfer',
  mobile_money: 'Mobile Money',
  mobile: 'Mobile Money',
  credit_card: 'Credit Card',
  debt: 'Debt',
  split: 'Split Payment',
};

const LEDGER_METHOD_LABELS: Record<string, string> = {
  debt: 'Debt Deposit',
  debt_deposit: 'Debt Deposit',
  deposit: 'Deposit',
};

export function normalizePaymentMethod(method?: string): string | undefined {
  return method?.toLowerCase();
}

export function formatPaymentMethodLabel(method?: string): string {
  const normalized = normalizePaymentMethod(method);
  if (!normalized) return 'Unknown';
  return PAYMENT_METHOD_LABELS[normalized] || method || 'Unknown';
}

export function formatLedgerPaymentLabel(method?: string): string {
  const normalized = normalizePaymentMethod(method);
  if (!normalized) return 'Payment';
  return (
    LEDGER_METHOD_LABELS[normalized] ||
    PAYMENT_METHOD_LABELS[normalized] ||
    (method || 'Payment')
  );
}

export function mapSplitPaymentMethod(method: string): string {
  return formatPaymentMethodLabel(method);
}

export function normalizePaymentMethodForStorage(method: string): string {
  const normalized = method?.toLowerCase().trim();
  if (!normalized) {
    return '';
  }

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
