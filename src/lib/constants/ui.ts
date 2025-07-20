/**
 * UI Constants
 * Shared constants for components to ensure consistency
 * Note: PAYMENT_METHODS_UI has been moved to @/lib/constants for centralization
 */

// Re-export payment methods UI from main constants
export { PAYMENT_METHODS_UI } from "@/lib/constants";

// Badge Variants for different statuses
export const BADGE_VARIANTS = {
  DEFAULT: "default",
  SECONDARY: "secondary",
  DESTRUCTIVE: "destructive",
  OUTLINE: "outline",
} as const;

// Status Color Mappings
export const STATUS_COLORS = {
  ACTIVE: "default",
  INACTIVE: "secondary",
  PENDING: "outline",
  APPROVED: "default",
  REJECTED: "destructive",
  SUSPENDED: "destructive",
  CRITICAL: "destructive",
  LOW: "secondary",
  NORMAL: "default",
} as const;

// Stock Status Mappings
export const STOCK_STATUS = {
  OUT_OF_STOCK: { label: "Out of Stock", variant: "destructive" as const },
  CRITICAL: { label: "Critical", variant: "destructive" as const },
  LOW: { label: "Low Stock", variant: "secondary" as const },
  NORMAL: { label: "Normal", variant: "default" as const },
} as const;

// Discrepancy Badge Variants
export const DISCREPANCY_VARIANTS = {
  NONE: "secondary" as const,
  POSITIVE: "default" as const,
  NEGATIVE: "destructive" as const,
} as const;

// Common Chart Colors
export const CHART_COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff7300",
  "#0088fe",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
] as const;

// Helper functions for badge variants
export const getDiscrepancyVariant = (discrepancy: number) => {
  if (discrepancy === 0) return DISCREPANCY_VARIANTS.NONE;
  return discrepancy > 0
    ? DISCREPANCY_VARIANTS.POSITIVE
    : DISCREPANCY_VARIANTS.NEGATIVE;
};

export const getStockStatusInfo = (stock: number, minStock: number) => {
  if (stock === 0) return STOCK_STATUS.OUT_OF_STOCK;
  if (stock <= minStock * 0.5) return STOCK_STATUS.CRITICAL;
  if (stock <= minStock) return STOCK_STATUS.LOW;
  return STOCK_STATUS.NORMAL;
};
