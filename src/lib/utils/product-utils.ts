/**
 * Product utility functions for inventory management
 */

/**
 * Calculate stock status based on current stock and minimum stock levels
 */
export function calculateStockStatus(
  currentStock: number,
  minStock: number
): 'out-of-stock' | 'critical' | 'low' | 'normal' {
  if (currentStock <= 0) return 'out-of-stock';
  if (currentStock <= minStock * 0.5) return 'critical';
  if (currentStock <= minStock) return 'low';
  return 'normal';
}

/**
 * Calculate profit margin percentage
 */
export function calculateProfitMargin(
  sellingPrice: number,
  costPrice: number
): number {
  if (costPrice <= 0) return 0;
  return ((sellingPrice - costPrice) / costPrice) * 100;
}

/**
 * Calculate profit amount
 */
export function calculateProfitAmount(
  sellingPrice: number,
  costPrice: number
): number {
  return sellingPrice - costPrice;
}

/**
 * Generate SKU based on product name, category, and brand
 */
export function generateSKU(
  productName: string,
  category?: string,
  brand?: string
): string {
  // Get first 3 letters of category (default: PRD)
  const categoryCode = category
    ? category.substring(0, 3).toUpperCase()
    : 'PRD';

  // Get first 2 letters of brand (default: XX)
  const brandCode = brand ? brand.substring(0, 2).toUpperCase() : 'XX';

  // Get first 3 letters of product name (default: PRO)
  const productCode = productName
    ? productName.substring(0, 3).toUpperCase()
    : 'PRO';

  // Generate random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000);

  return `${categoryCode}-${brandCode}-${productCode}-${randomNum}`;
}

/**
 * Validate EAN-13 barcode
 */
export function validateBarcode(barcode: string): boolean {
  if (!barcode || barcode.length !== 13) return false;

  // Check if all characters are digits
  if (!/^\d{13}$/.test(barcode)) return false;

  // EAN-13 checksum validation
  const digits = barcode.split('').map(Number);
  const checkDigit = digits[12];

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }

  const calculatedCheckDigit = (10 - (sum % 10)) % 10;
  return checkDigit === calculatedCheckDigit;
}

/**
 * Calculate search relevance score for product search
 */
export function calculateSearchRelevance(
  searchTerm: string,
  productName: string,
  productSku?: string,
  productDescription?: string
): number {
  const term = searchTerm.toLowerCase();
  const name = productName.toLowerCase();
  const sku = productSku?.toLowerCase() || '';
  const description = productDescription?.toLowerCase() || '';

  let score = 0;

  // Exact name match gets highest score
  if (name === term) score += 100;
  // Name contains search term
  else if (name.includes(term)) score += 50;

  // SKU exact match
  if (sku === term) score += 80;
  // SKU contains search term
  else if (sku.includes(term)) score += 40;

  // Description contains search term
  if (description.includes(term)) score += 20;

  // Partial word matches
  const nameWords = name.split(/\s+/);
  const termWords = term.split(/\s+/);

  for (const word of termWords) {
    if (nameWords.some(nameWord => nameWord.startsWith(word))) {
      score += 10;
    }
  }

  return score;
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
}
