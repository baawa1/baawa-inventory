/**
 * Badge Helper Utilities
 * Shared functions for consistent badge rendering patterns
 */

import {
  getDiscrepancyVariant,
  getStockStatusInfo,
  STATUS_COLORS,
} from '@/lib/constants/ui';
import { PRODUCT_STATUS } from '@/lib/constants';

export interface BadgeVariant {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
}

export interface BadgeConfig {
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  label: string;
}

/**
 * Get discrepancy badge configuration
 */
export function getDiscrepancyBadgeConfig(discrepancy: number): BadgeConfig {
  const variant = getDiscrepancyVariant(discrepancy);
  const label = discrepancy > 0 ? `+${discrepancy}` : `${discrepancy}`;

  return { variant, label };
}

/**
 * Get stock status badge configuration
 */
export function getStockStatusBadgeConfig(
  stock: number,
  minStock: number
): BadgeConfig {
  const statusInfo = getStockStatusInfo(stock, minStock);

  return {
    variant: statusInfo.variant,
    label: statusInfo.label,
  };
}

/**
 * Get user status badge configuration
 */
export function getUserStatusBadgeConfig(status: string): BadgeConfig {
  const variant =
    STATUS_COLORS[status as keyof typeof STATUS_COLORS] || 'outline';

  return {
    variant: variant as BadgeVariant['variant'],
    label: status,
  };
}

/**
 * Get product status badge configuration
 */
export function getProductStatusBadgeConfig(status: string): BadgeConfig {
  const variant = status === PRODUCT_STATUS.ACTIVE ? 'default' : 'secondary';
  const label = status === PRODUCT_STATUS.ACTIVE ? 'Active' : 'Inactive';

  return { variant, label };
}

/**
 * Get profit margin badge configuration
 */
export function getProfitMarginBadgeConfig(profitMargin: number): BadgeConfig {
  const variant = profitMargin > 0 ? 'default' : 'secondary';

  return {
    variant,
    label: `${profitMargin.toFixed(2)}%`,
  };
}

/**
 * Generic status badge configuration with custom mapping
 */
export function getGenericStatusBadgeConfig(
  status: string,
  statusMapping?: Record<
    string,
    { variant: BadgeVariant['variant']; label?: string }
  >
): BadgeConfig {
  const mapping = statusMapping || {};
  const config = mapping[status];

  if (config) {
    return {
      variant: config.variant,
      label: config.label || status,
    };
  }

  // Default fallback
  return {
    variant: 'outline',
    label: status,
  };
}
