// Base types for the application
export type UserRole = 'ADMIN' | 'MANAGER' | 'STAFF';

export type ProductStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'OUT_OF_STOCK'
  | 'DISCONTINUED';

export type PaymentMethod =
  | 'CASH'
  | 'BANK_TRANSFER'
  | 'POS_MACHINE'
  | 'CREDIT_CARD'
  | 'MOBILE_MONEY';

export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED' | 'CANCELLED';

export type DiscountType = 'AMOUNT' | 'PERCENTAGE';

export type AIContentType =
  | 'DESCRIPTION'
  | 'SEO_TITLE'
  | 'SEO_DESCRIPTION'
  | 'SOCIAL_MEDIA_POST'
  | 'PRODUCT_FEATURES'
  | 'MARKETING_COPY';

export type ContentStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'REJECTED';

export type ContentSyncStatus = 'pending' | 'synced' | 'failed';

// Product types
export interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: string;
  brand?: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  weight?: number;
  dimensions?: string;
  color?: string;
  size?: string;
  material?: string;
  status: ProductStatus;
  hasVariants: boolean;
  isArchived: boolean;
  images?: string[];
  tags: string[];

  supplierId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  category: string;
  brand?: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  weight?: number;
  dimensions?: string;
  color?: string;
  size?: string;
  material?: string;
  supplierId?: string;
  images?: string[];
  tags?: string[];
}

// User types are now defined in src/types/user.ts

// Sales types
export interface SalesTransactionData {
  id: string;
  transactionCode: string;
  total: number;
  subtotal: number;
  tax: number;
  discount: number;
  discountType: DiscountType;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  receiptNumber?: string;
  isRefund: boolean;
  refundReason?: string;
  syncedToContent: boolean;
  syncedAt?: Date;
  cashierId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSalesTransactionData {
  items: Array<{
    productId?: string;
    variantId?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  discount?: number;
  discountType?: DiscountType;
  notes?: string;
}

// Supplier types
export interface SupplierData {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = Record<string, unknown>> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = Record<string, unknown>>
  extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    totalPages: number;
    total: number;
  };
}

// Search and Filter types
export interface ProductFilters {
  category?: string;
  supplier?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  search?: string;
}

export interface SalesFilters {
  dateFrom?: Date;
  dateTo?: Date;
  paymentMethod?: string;
  cashier?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Dashboard Analytics types
export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  todaySales: number;
  monthSales: number;
  pendingOrders: number;
  recentTransactions: SalesTransactionData[];
}

// Inventory Management types
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  value: number;
  lastUpdated: Date;
}

// AI Content types
export interface AIContentRequest {
  type: AIContentType;
  productId: string;
  tone?: string;
  keywords?: string[];
  prompt?: string;
}

// Content Sync types
export interface ContentSyncData {
  productId: string;
  name: string;
  description?: string;
  price: number;
  images?: string[];
  category: string;
  inStock: boolean;
  sku: string;
}

// Form validation types
export interface FormErrors {
  [key: string]: string;
}

// Table column definitions
export interface TableColumn<T = Record<string, unknown>> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (_value: unknown, _row: T) => React.ReactNode;
}
