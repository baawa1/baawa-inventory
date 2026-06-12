export function normalizePaymentStatus(
  status?: string | null
): string | undefined {
  if (!status) return undefined;

  const trimmed = status.trim();
  if (!trimmed) return undefined;

  const lower = trimmed.toLowerCase();

  if (lower === 'paid' || lower === 'completed') {
    return 'PAID';
  }

  if (lower === 'partial') {
    return 'PARTIAL';
  }

  if (lower === 'pending') {
    return 'PENDING';
  }

  if (lower === 'cancelled' || lower === 'canceled') {
    return 'CANCELLED';
  }

  if (lower === 'refunded') {
    return 'REFUNDED';
  }

  return trimmed.toUpperCase();
}

export function isNormalizedSuccessfulPaymentStatus(
  status?: string | null
): boolean {
  return normalizePaymentStatus(status) === 'PAID';
}
