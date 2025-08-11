/**
 * Phone number utilities for Nigerian phone numbers
 * Handles normalization, validation, and formatting
 */

export interface NormalizedPhone {
  original: string;
  normalized: string;
  formatted: string;
  isValid: boolean;
  countryCode: string;
  localNumber: string;
}

/**
 * Normalize Nigerian phone numbers to a consistent format
 * Converts various formats to international format: +234XXXXXXXXX
 */
export function normalizeNigerianPhone(phone: string): NormalizedPhone {
  if (!phone || typeof phone !== 'string') {
    return {
      original: phone || '',
      normalized: '',
      formatted: '',
      isValid: false,
      countryCode: '',
      localNumber: '',
    };
  }

  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');

  // Handle different Nigerian phone number formats
  let normalized = '';
  let countryCode = '';
  let localNumber = '';
  let isValid = false;

  // Pattern 1: +234XXXXXXXXX (already in international format)
  if (cleaned.startsWith('+234') && cleaned.length === 14) {
    normalized = cleaned;
    countryCode = '+234';
    localNumber = cleaned.substring(4);
    isValid = true;
  }
  // Pattern 2: 234XXXXXXXXX (international without +)
  else if (cleaned.startsWith('234') && cleaned.length === 13) {
    normalized = '+' + cleaned;
    countryCode = '+234';
    localNumber = cleaned.substring(3);
    isValid = true;
  }
  // Pattern 3: 0XXXXXXXXX (local format)
  else if (cleaned.startsWith('0') && cleaned.length === 11) {
    normalized = '+234' + cleaned.substring(1);
    countryCode = '+234';
    localNumber = cleaned.substring(1);
    isValid = true;
  }
  // Pattern 4: XXXXXXXXX (local without 0)
  else if (cleaned.length === 10 && /^[7-9]/.test(cleaned)) {
    normalized = '+234' + cleaned;
    countryCode = '+234';
    localNumber = cleaned;
    isValid = true;
  }

  // Format for display
  const formatted = isValid ? formatPhoneForDisplayInternal(normalized) : phone;

  return {
    original: phone,
    normalized,
    formatted,
    isValid,
    countryCode,
    localNumber,
  };
}

/**
 * Internal function to format phone number for display
 * Converts +234XXXXXXXXX to +234 XXX XXX XXXX
 */
function formatPhoneForDisplayInternal(phone: string): string {
  if (!phone) return '';

  // Format: +234 XXX XXX XXXX
  if (phone.startsWith('+234') && phone.length === 14) {
    const local = phone.substring(4);
    if (local.length === 10) {
      return `+234 ${local.substring(0, 3)} ${local.substring(3, 6)} ${local.substring(6)}`;
    }
  }

  return phone;
}

/**
 * Format phone number for display
 * Converts +234XXXXXXXXX to +234 XXX XXX XXXX
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';

  const normalized = normalizeNigerianPhone(phone);
  if (!normalized.isValid) return phone;

  return formatPhoneForDisplayInternal(normalized.normalized);
}

/**
 * Check if two phone numbers are equivalent
 * Compares normalized versions of phone numbers
 */
export function arePhonesEquivalent(phone1: string, phone2: string): boolean {
  if (!phone1 || !phone2) return false;

  const normalized1 = normalizeNigerianPhone(phone1);
  const normalized2 = normalizeNigerianPhone(phone2);

  return (
    normalized1.isValid &&
    normalized2.isValid &&
    normalized1.normalized === normalized2.normalized
  );
}

/**
 * Validate Nigerian phone number format
 */
export function isValidNigerianPhone(phone: string): boolean {
  return normalizeNigerianPhone(phone).isValid;
}

/**
 * Get search patterns for phone number matching
 * Returns multiple formats to search for in database
 */
export function getPhoneSearchPatterns(phone: string): string[] {
  const normalized = normalizeNigerianPhone(phone);
  if (!normalized.isValid) return [phone]; // Return original if invalid

  const patterns = [
    normalized.normalized, // +234XXXXXXXXX
    normalized.normalized.substring(1), // 234XXXXXXXXX
    '0' + normalized.localNumber, // 0XXXXXXXXX
    normalized.localNumber, // XXXXXXXXX
  ];

  // Remove duplicates
  return [...new Set(patterns)];
}

/**
 * Extract digits only from phone number
 * Useful for partial matching
 */
export function extractDigitsOnly(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Check if phone number contains the search digits
 * For partial matching in search functionality
 */
export function phoneContainsDigits(
  phone: string,
  searchDigits: string
): boolean {
  if (!phone || !searchDigits) return false;

  const phoneDigits = extractDigitsOnly(phone);
  const searchDigitsOnly = extractDigitsOnly(searchDigits);

  return phoneDigits.includes(searchDigitsOnly);
}

/**
 * Get the preferred storage format for phone numbers
 * Returns the international format for consistent storage
 */
export function getPreferredPhoneFormat(phone: string): string {
  const normalized = normalizeNigerianPhone(phone);
  return normalized.isValid ? normalized.normalized : phone;
}
