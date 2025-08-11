/**
 * POS System Type Definitions
 * Centralized types for Point of Sale functionality
 */

import type { Prisma } from '@prisma/client';

// Base POS Types
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

export interface Sale {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  fees?: Array<{
    type: string;
    description?: string;
    amount: number;
  }>;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  staffName: string;
  timestamp: Date;
  notes?: string | null;
  splitPayments?: Array<{
    id: string;
    amount: number;
    method: string;
    createdAt: Date;
  }>;
}

export interface CouponData {
  id: number;
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minimumAmount?: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  billingAddress?: string;
  shippingAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  customerType?: 'individual' | 'business';
  notes?: string;
  useBillingAsShipping?: boolean;
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  shippingCountry?: string;
}

export interface TransactionFee {
  feeType: string;
  description?: string;
  amount: number;
}

export interface SplitPayment {
  id: string;
  amount: number;
  method: string;
}

// Customer API Types
export interface Customer {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  customerType?: string;
  billingAddress?: string;
  shippingAddress?: string;
  notes?: string;
  source?: string;
  lastPurchase?: Date | string;
  lastAmount?: number;
  priority?: number;
  totalSpent?: number;
  totalOrders?: number;
  averageOrderValue?: number;
  rank?: number;
  type?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CustomerSearchResult {
  customers: Customer[];
  total: number;
}

// Payment Step Types
export interface OrderSummaryStepProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  fees: TransactionFee[];
  total: number;
  _appliedCoupon: CouponData | null;
  couponDiscount: number;
}

export interface PaymentMethodStepProps {
  paymentMethod: string;
  setPaymentMethod: (method: string) => void;
  amountPaid: number;
  setAmountPaid: React.Dispatch<React.SetStateAction<number>>;
  total: number;
  discount: number;
  change: number;
  processing: boolean;
  isSplitPayment: boolean;
  setIsSplitPayment: (isSplit: boolean) => void;
  _splitPayments: SplitPayment[];
  _setSplitPayments: React.Dispatch<React.SetStateAction<SplitPayment[]>>;
}

export interface CustomerInfoStepProps {
  customerInfo: CustomerInfo;
  onCustomerInfoChange: (info: CustomerInfo) => void;
  processing: boolean;
}

export interface ReviewStepProps {
  items: CartItem[];
  subtotal: number;
  discount: number;
  fees: TransactionFee[];
  total: number;
  paymentMethod: string;
  customerInfo: CustomerInfo;
  amountPaid: number;
  change: number;
  notes: string;
  setNotes: (notes: string) => void;
  processing: boolean;
  isSplitPayment: boolean;
  splitPayments: SplitPayment[];
  couponDiscount: number;
}

export interface SplitPaymentInterfaceProps {
  splitPayments: SplitPayment[];
  setSplitPayments: (payments: SplitPayment[]) => void;
  total: number;
  processing: boolean;
}

// API Response Types
export interface CustomerApiResponse {
  data: Customer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SaleApiResponse {
  success: boolean;
  saleId: number;
  transactionNumber: string;
  message: string;
  emailSent: boolean;
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

// Prisma Types
export type SalesTransactionWithIncludes = Prisma.SalesTransactionGetPayload<{
  include: {
    sales_items: {
      include: {
        products: true;
        product_variants: true;
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

export type SalesItemWithIncludes = Prisma.SalesItemGetPayload<{
  include: {
    products: true;
    product_variants: true;
    coupon: true;
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

// Utility Types
export type PaymentMethod =
  | 'cash'
  | 'pos'
  | 'bank_transfer'
  | 'mobile_money'
  | 'split';

export type DiscountType = 'percentage' | 'fixed';

export type StepId =
  | 'order-summary'
  | 'payment-method'
  | 'customer-info'
  | 'review'
  | 'receipt';

// Step Configuration
export interface StepConfig {
  id: StepId;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Auto-search Types
export interface AutoSearchResult {
  customers: Customer[];
  loading: boolean;
  error: string | null;
}

// Receipt Types
export interface ReceiptData {
  sale: Sale | null;
  printData?: {
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
    }>;
    summary: {
      subtotal: number;
      discount: number;
      fees: TransactionFee[];
      total: number;
      change: number;
    };
    customer: CustomerInfo;
    staff: string;
    timestamp: Date;
    transactionNumber: string;
  };
}
