import { ProductStatus } from '@prisma/client';

export type AvailabilityStatus =
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'INACTIVE'
  | 'DISCONTINUED'
  | 'ARCHIVED';

/**
 * Get computed availability status based on product state
 */
export function getAvailabilityStatus(product: {
  isArchived: boolean;
  status: ProductStatus;
  stock: number;
  minStock: number;
  isService: boolean;
}): AvailabilityStatus {
  // Services are always available (no stock)
  if (product.isService) {
    return product.isArchived ? 'ARCHIVED' :
           product.status === 'DISCONTINUED' ? 'DISCONTINUED' :
           product.status === 'INACTIVE' ? 'INACTIVE' : 'IN_STOCK';
  }

  // Archived takes precedence
  if (product.isArchived) return 'ARCHIVED';

  // Status-based states
  if (product.status === 'DISCONTINUED') return 'DISCONTINUED';
  if (product.status === 'INACTIVE') return 'INACTIVE';

  // Stock-based states (only for ACTIVE products)
  if (product.stock <= 0) return 'OUT_OF_STOCK';
  if (product.stock <= product.minStock) return 'LOW_STOCK';

  return 'IN_STOCK';
}

/**
 * Get badge color for status
 */
export function getStatusBadgeColor(status: AvailabilityStatus): string {
  const colors = {
    'IN_STOCK': 'green',
    'LOW_STOCK': 'yellow',
    'OUT_OF_STOCK': 'red',
    'INACTIVE': 'gray',
    'DISCONTINUED': 'purple',
    'ARCHIVED': 'gray'
  };
  return colors[status];
}

/**
 * Check if product can be sold
 */
export function canBeSold(product: {
  isArchived: boolean;
  status: ProductStatus;
  stock: number;
  isService: boolean;
}): boolean {
  if (product.isArchived) return false;
  if (product.status === 'DISCONTINUED') return false;
  if (product.status === 'INACTIVE') return false;
  if (product.isService) return true;  // Services always available
  if (product.stock <= 0) return false;

  return true;
}
