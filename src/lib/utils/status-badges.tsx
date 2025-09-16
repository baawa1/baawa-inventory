import React from 'react';
import { Badge } from '@/components/ui/badge';

export type StatusType = 'product' | 'category' | 'brand' | 'supplier' | 'coupon' | 'user' | 'finance';

export interface StatusBadgeConfig {
  [key: string]: {
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
    label: string;
  };
}

const STATUS_CONFIGS: Record<StatusType, StatusBadgeConfig> = {
  product: {
    ACTIVE: { variant: 'default', className: 'bg-green-500 hover:bg-green-600', label: 'Active' },
    INACTIVE: { variant: 'secondary', label: 'Inactive' },
    OUT_OF_STOCK: { variant: 'secondary', className: 'bg-yellow-500 hover:bg-yellow-600', label: 'Out of Stock' },
    DISCONTINUED: { variant: 'secondary', className: 'bg-gray-500 hover:bg-gray-600', label: 'Discontinued' },
  },
  category: {
    true: { variant: 'default', className: 'bg-green-500 hover:bg-green-600', label: 'Active' },
    false: { variant: 'secondary', label: 'Inactive' },
  },
  brand: {
    true: { variant: 'default', className: 'bg-green-500 hover:bg-green-600', label: 'Active' },
    false: { variant: 'secondary', label: 'Inactive' },
  },
  supplier: {
    ACTIVE: { variant: 'default', className: 'bg-green-500 hover:bg-green-600', label: 'Active' },
    INACTIVE: { variant: 'secondary', label: 'Inactive' },
  },
  coupon: {
    active: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-200', label: 'Active' },
    inactive: { variant: 'secondary', className: 'bg-gray-100 text-gray-800 hover:bg-gray-200', label: 'Inactive' },
    expired: { variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-200', label: 'Expired' },
    'used up': { variant: 'secondary', className: 'bg-orange-100 text-orange-800 hover:bg-orange-200', label: 'Used Up' },
  },
  user: {
    APPROVED: { variant: 'default', label: 'Approved' },
    PENDING: { variant: 'secondary', label: 'Pending' },
    VERIFIED: { variant: 'outline', label: 'Verified' },
    REJECTED: { variant: 'destructive', label: 'Rejected' },
    SUSPENDED: { variant: 'destructive', label: 'Suspended' },
  },
  finance: {
    PENDING: { variant: 'outline', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200', label: 'Pending' },
    COMPLETED: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-200', label: 'Completed' },
    APPROVED: { variant: 'default', className: 'bg-blue-100 text-blue-800 hover:bg-blue-200', label: 'Approved' },
    CANCELLED: { variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-200', label: 'Cancelled' },
    REJECTED: { variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-200', label: 'Rejected' },
  },
};

export const createStatusBadge = (
  status: string | boolean, 
  type: StatusType, 
  className?: string
): React.ReactElement => {
  const statusKey = typeof status === 'boolean' ? status.toString() : status;
  const config = STATUS_CONFIGS[type]?.[statusKey];
  
  if (!config) {
    return (
      <Badge variant="outline" className={className}>
        {statusKey}
      </Badge>
    );
  }

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className || ''} ${className || ''}`.trim()}
    >
      {config.label}
    </Badge>
  );
};

// Helper functions for specific status types
export const getProductStatusBadge = (status: string, className?: string) => 
  createStatusBadge(status, 'product', className);

export const getCategoryStatusBadge = (isActive: boolean, className?: string) => 
  createStatusBadge(isActive, 'category', className);

export const getBrandStatusBadge = (isActive: boolean, className?: string) => 
  createStatusBadge(isActive, 'brand', className);

export const getSupplierStatusBadge = (status: string, className?: string) => 
  createStatusBadge(status, 'supplier', className);

export const getCouponStatusBadge = (status: string, className?: string) => 
  createStatusBadge(status, 'coupon', className);

export const getUserStatusBadge = (status: string, className?: string) => 
  createStatusBadge(status, 'user', className);

export const getFinanceStatusBadge = (status: string, className?: string) => 
  createStatusBadge(status, 'finance', className);