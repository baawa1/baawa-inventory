export const POS_PAYMENT_METHODS = [
  'cash',
  'pos',
  'bank_transfer',
  'mobile_money',
  'debt',
  'split',
] as const;

export type PosPaymentMethod = (typeof POS_PAYMENT_METHODS)[number];
