/**
 * POS System Type Definitions
 * Centralized types for Point of Sale functionality
 */

import { Prisma } from '@prisma/client';

// Database query types using Prisma
export type SalesTransactionWithIncludes = Prisma.SalesTransactionGetPayload<{
  include: {
    sales_items: {
      include: {
        products: {
          select: {
            name: true;
            sku: true;
            barcode: true;
          };
        };
        coupon: {
          select: {
            id: true;
            code: true;
            name: true;
            type: true;
            value: true;
          };
        };
      };
    };
    users: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
      };
    };
    customer: {
      select: {
        id: true;
        name: true;
        email: true;
        phone: true;
        city: true;
        state: true;
      };
    };
    transaction_fees: true;
  };
}>;

export type ProductWithIncludes = Prisma.ProductGetPayload<{
  include: {
    category: {
      select: {
        id: true;
        name: true;
      };
    };
    brand: {
      select: {
        id: true;
        name: true;
      };
    };
    sales_items: {
      include: {
        sales_transactions: {
          select: {
            created_at: true;
          };
        };
      };
    };
  };
}>;

// Transaction filter types
export interface TransactionFilters {
  search?: string;
  paymentMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  staffId?: string;
}

export interface TransactionWhereClause {
  OR?: Array<{
    transaction_number?: { contains: string; mode: 'insensitive' };
    customer?: {
      OR: Array<{
        name?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
        phone?: { contains: string; mode: 'insensitive' };
      }>;
    };
    users?: {
      OR: Array<{
        firstName?: { contains: string; mode: 'insensitive' };
        lastName?: { contains: string; mode: 'insensitive' };
      }>;
    };
  }>;
  payment_method?: string;
  created_at?: {
    gte?: Date;
    lte?: Date;
  };
  user_id?: number;
}

// Product filter types
export interface ProductFilters {
  search?: string;
  categoryId?: number;
  status?: string;
}

export interface ProductWhereClause {
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    sku?: { contains: string; mode: 'insensitive' };
  }>;
  categoryId?: number;
  status?: string;
}

// Customer aggregation types
export interface CustomerAggregation {
  customer_id: number | null;
  customer: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  _sum: {
    total_amount: Prisma.Decimal | null;
  };
  _count: {
    id: number;
  };
  _max: {
    created_at: Date | null;
  };
}

// Transformed response types
export interface TransformedTransaction {
  id: number;
  transactionNumber: string;
  items: Array<{
    id: number;
    productId: number;
    name: string;
    sku: string;
    price: number;
    quantity: number;
    total: number;
    coupon?: {
      id: number;
      code: string;
      name: string;
      type: string;
      value: number;
    } | null;
  }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  customer: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
  } | null;
  fees?: Array<{
    id: number;
    type: string;
    description: string | null;
    amount: number;
    createdAt: Date | null;
  }>;
  staffName: string;
  staffId: number;
  timestamp: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  notes: string | null;
}

export interface TransformedProduct {
  id: number;
  name: string;
  sku: string;
  barcode: string | null;
  price: number;
  stock: number;
  status: string;
  category: {
    id: number;
    name: string;
  } | null;
  brand: {
    id: number;
    name: string;
  } | null;
  description: string | null;
}

export interface TransformedCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  totalSpent: number;
  totalOrders: number;
  lastPurchase: string;
  averageOrderValue: number;
  rank: number;
}

// Cart and Sale types
export interface CartItem {
  id: number;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  stock: number;
  category?: string;
  brand?: string;
}

export interface SaleItem {
  productId: number;
  quantity: number;
  price: number;
  total: number;
}

export interface CreateSaleRequest {
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerInfo?: {
    name?: string;
    phone?: string;
    email?: string;
    billingAddress?: string;
    shippingAddress?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    customerType?: 'individual' | 'business';
    notes?: string;
  };
  fees?: Array<{
    feeType: string;
    description?: string;
    amount: number;
  }>;
  amountPaid?: number;
  notes?: string;
}

export interface SaleResponse {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customer?: {
    id: number;
    name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
  } | null;
  fees?: Array<{
    type: string;
    description?: string;
    amount: number;
  }>;
  staffName: string;
  timestamp: Date;
}

// Analytics types
export interface ProductPerformance {
  id: number;
  name: string;
  sku: string;
  category: string | null;
  brand: string | null;
  currentStock: number;
  totalSold: number;
  revenue: number;
  averageOrderValue: number;
  lastSold: string | null;
  trending: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface CategoryPerformance {
  id: number;
  name: string;
  totalSold: number;
  revenue: number;
  averageOrderValue: number;
  marketShare: number;
  trending: 'up' | 'down' | 'stable';
  trendPercentage: number;
  lastSaleDate: string | null;
  productCount: number;
  topProducts: Array<{
    id: number;
    name: string;
    revenue: number;
  }>;
}
