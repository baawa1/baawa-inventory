import type { Prisma } from '@prisma/client';

// Base API Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DateRangeParams {
  fromDate?: string;
  toDate?: string;
}

export interface SearchParams {
  search?: string;
}

// Sales API Types
export interface SalesFilters
  extends PaginationParams,
    DateRangeParams,
    SearchParams {
  paymentStatus?: string;
  paymentMethod?: string;
  userId?: string;
}

export interface SalesWhereClause {
  OR?: Array<{
    transaction_number?: { contains: string; mode: 'insensitive' };
    customer_name?: { contains: string; mode: 'insensitive' };
    notes?: { contains: string; mode: 'insensitive' };
  }>;
  payment_status?: string;
  payment_method?: string;
  user_id?: number;
  created_at?: {
    gte?: Date;
    lte?: Date;
  };
}

export interface SalesOrderByClause {
  created_at?: 'asc' | 'desc';
  total_amount?: 'asc' | 'desc';
  transaction_number?: 'asc' | 'desc';
}

export interface SalesSelectClause {
  id: boolean;
  transaction_number: boolean;
  customer_id: boolean;
  subtotal: boolean;
  discount_amount: boolean;
  tax_amount: boolean;
  total_amount: boolean;
  payment_status: boolean;
  payment_method: boolean;
  notes: boolean;
  created_at: boolean;
  updated_at: boolean;
  users: {
    select: {
      id: boolean;
      firstName: boolean;
      lastName: boolean;
      email: boolean;
    };
  };
  customer: {
    select: {
      id: boolean;
      name: boolean;
      email: boolean;
      phone: boolean;
      city: boolean;
      state: boolean;
      customerType: boolean;
    };
  };
  sales_items: {
    select: {
      id: boolean;
      quantity: boolean;
      unit_price: boolean;
      total_price: boolean;
      discount_amount: boolean;
      products: {
        select: {
          id: boolean;
          name: boolean;
          sku: boolean;
        };
      };
    };
  };
  transaction_fees: {
    select: {
      id: boolean;
      feeType: boolean;
      description: boolean;
      amount: boolean;
    };
  };
  split_payments: {
    select: {
      id: boolean;
      amount: boolean;
      method: boolean;
    };
  };
}

// Inventory API Types
export interface InventoryFilters
  extends PaginationParams,
    DateRangeParams,
    SearchParams {
  categoryId?: string;
  brandId?: string;
  status?: string;
  supplierId?: string;
  lowStock?: boolean;
  outOfStock?: boolean;
}

export interface InventoryWhereClause {
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    sku?: { contains: string; mode: 'insensitive' };
    barcode?: { contains: string; mode: 'insensitive' };
  }>;
  categoryId?: number;
  brandId?: number;
  status?: string;
  supplierId?: number;
  stock?: {
    lte?: number;
    equals?: number;
  };
}

export interface InventoryOrderByClause {
  name?: 'asc' | 'desc';
  sku?: 'asc' | 'desc';
  stock?: 'asc' | 'desc';
  price?: 'asc' | 'desc';
  created_at?: 'asc' | 'desc';
  updated_at?: 'asc' | 'desc';
}

// Products API Types
export interface ProductFilters extends InventoryFilters {
  priceMin?: number;
  priceMax?: number;
  stockMin?: number;
  stockMax?: number;
}

export interface ProductWhereClause extends InventoryWhereClause {
  price?: {
    gte?: number;
    lte?: number;
  };
  stock?: {
    gte?: number;
    lte?: number;
  };
}

export interface ProductIncludeClause {
  category?: boolean | { select: { id: boolean; name: boolean } };
  brand?: boolean | { select: { id: boolean; name: boolean } };
  supplier?: boolean | { select: { id: boolean; name: boolean } };
  sales_items?: boolean;
  stockAdditions?: boolean;
  stockAdjustments?: boolean;
}

// Stock API Types
export interface StockAdditionFilters
  extends PaginationParams,
    DateRangeParams,
    SearchParams {
  supplierId?: string;
  productId?: string;
  status?: string;
}

export interface StockAdditionWhereClause {
  OR?: Array<{
    referenceNo?: { contains: string; mode: 'insensitive' };
    notes?: { contains: string; mode: 'insensitive' };
  }>;
  supplierId?: number;
  productId?: number;
  status?: string;
  purchaseDate?: {
    gte?: Date;
    lte?: Date;
  };
}

// Financial API Types
export interface FinancialFilters
  extends PaginationParams,
    DateRangeParams,
    SearchParams {
  type?: 'INCOME' | 'EXPENSE';
  paymentMethod?: string;
  status?: string;
  category?: string;
}

export interface FinancialWhereClause {
  OR?: Array<{
    description?: { contains: string; mode: 'insensitive' };
    transactionNumber?: { contains: string; mode: 'insensitive' };
  }>;
  type?: 'INCOME' | 'EXPENSE';
  paymentMethod?: string;
  status?: string;
  transactionDate?: {
    gte?: Date;
    lte?: Date;
  };
}

// POS API Types
export interface POSFilters
  extends PaginationParams,
    DateRangeParams,
    SearchParams {
  paymentMethod?: string;
  customerId?: string;
  staffId?: string;
}

export interface POSWhereClause {
  OR?: Array<{
    transaction_number?: { contains: string; mode: 'insensitive' };
    customer_name?: { contains: string; mode: 'insensitive' };
    notes?: { contains: string; mode: 'insensitive' };
  }>;
  payment_method?: string;
  customer_id?: number;
  user_id?: number;
  created_at?: {
    gte?: Date;
    lte?: Date;
  };
}

// Customer API Types
export interface CustomerFilters
  extends PaginationParams,
    DateRangeParams,
    SearchParams {
  customerType?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
}

export interface CustomerWhereClause {
  OR?: Array<{
    name?: { contains: string; mode: 'insensitive' };
    email?: { contains: string; mode: 'insensitive' };
    phone?: { contains: string; mode: 'insensitive' };
  }>;
  customerType?: string;
  city?: string;
  state?: string;
  isActive?: boolean;
  createdAt?: {
    gte?: Date;
    lte?: Date;
  };
}

// Report API Types
export interface ReportFilters extends DateRangeParams {
  categoryId?: string;
  brandId?: string;
  supplierId?: string;
  reportType?: string;
  format?: 'json' | 'csv' | 'pdf';
}

export interface ReportWhereClause {
  categoryId?: number;
  brandId?: number;
  supplierId?: number;
  created_at?: {
    gte?: Date;
    lte?: Date;
  };
}

// Update Data Types
export interface ProductUpdateData {
  name?: string;
  sku?: string;
  barcode?: string;
  description?: string;
  price?: number;
  stock?: number;
  minStock?: number;
  categoryId?: number;
  brandId?: number;
  supplierId?: number;
  status?: string;
  images?: Array<{
    url: string;
    alt?: string;
  }>;
}

export interface StockAdditionUpdateData {
  referenceNo?: string;
  supplierId?: number;
  purchaseDate?: Date;
  totalCost?: number;
  notes?: string;
  status?: string;
  items?: Array<{
    productId: number;
    quantity: number;
    cost: number;
  }>;
}

export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
  status?: string;
  isEmailVerified?: boolean;
}

// Transaction Types
export interface SalesTransactionData {
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
    total: number;
    couponId?: number;
  }>;
  subtotal: number;
  discount: number;
  fees?: Array<{
    feeType: string;
    description?: string;
    amount: number;
  }>;
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
  amountPaid?: number;
  notes?: string;
  splitPayments?: Array<{
    amount: number;
    method: string;
  }>;
}

// Prisma Generated Types
export type SalesTransactionWithIncludes = Prisma.SalesTransactionGetPayload<{
  include: {
    sales_items: {
      include: {
        products: true;
        coupon: true;
      };
    };
    customer: true;
    split_payments: true;
    transaction_fees: true;
    users: {
      select: {
        id: true;
        firstName: true;
        lastName: true;
        email: true;
      };
    };
  };
}>;

export type ProductWithIncludes = Prisma.ProductGetPayload<{
  include: {
    category: true;
    brand: true;
    supplier: true;
    sales_items: true;
    stockAdditions: true;
    stockAdjustments: true;
  };
}>;

export type CustomerWithIncludes = Prisma.CustomerGetPayload<{
  include: {
    salesTransactions: {
      include: {
        sales_items: true;
      };
    };
  };
}>;

export type StockAdditionWithIncludes = Prisma.StockAdditionGetPayload<{
  include: {
    supplier: true;
    createdBy: true;
    items: {
      include: {
        product: true;
      };
    };
  };
}>;

export type FinancialTransactionWithIncludes =
  Prisma.FinancialTransactionGetPayload<{
    include: {
      incomeDetails: true;
      expenseDetails: true;
      createdByUser: true;
    };
  }>;

// Response Types
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
}

// Error Types
export interface ApiError {
  field: string;
  message: string;
}

export interface ValidationError {
  error: string;
  details: ApiError[];
}

// Utility Types
export type SortOrder = 'asc' | 'desc';

export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'POS_MACHINE'
  | 'CREDIT_CARD'
  | 'MOBILE_MONEY';

export type TransactionType = 'INCOME' | 'EXPENSE';

export type ProductStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'OUT_OF_STOCK'
  | 'DISCONTINUED';

export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export type UserStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';
