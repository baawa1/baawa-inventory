// Base types for the application
export type UserRole = "ADMIN" | "MANAGER" | "STAFF";

export type ProductStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "OUT_OF_STOCK"
  | "DISCONTINUED";

export type PaymentMethod =
  | "CASH"
  | "BANK_TRANSFER"
  | "POS_MACHINE"
  | "CREDIT_CARD"
  | "MOBILE_MONEY";

export type PaymentStatus = "PENDING" | "PAID" | "REFUNDED" | "CANCELLED";

export type DiscountType = "AMOUNT" | "PERCENTAGE";

export type StockAdjustmentType =
  | "INCREASE"
  | "DECREASE"
  | "RECOUNT"
  | "DAMAGE"
  | "TRANSFER"
  | "RETURN";

export type PurchaseOrderStatus =
  | "PENDING"
  | "ORDERED"
  | "PARTIAL_RECEIVED"
  | "RECEIVED"
  | "CANCELLED";

export type AIContentType =
  | "DESCRIPTION"
  | "SEO_TITLE"
  | "SEO_DESCRIPTION"
  | "SOCIAL_MEDIA_POST"
  | "PRODUCT_FEATURES"
  | "MARKETING_COPY";

export type ContentStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "PUBLISHED"
  | "REJECTED";

export type WebflowSyncStatus =
  | "PENDING"
  | "SYNCING"
  | "SUCCESS"
  | "FAILED"
  | "RETRY";

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
  metaTitle?: string;
  metaDescription?: string;
  seoKeywords: string[];
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
  metaTitle?: string;
  metaDescription?: string;
  seoKeywords?: string[];
}

// User types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Sales types
export interface SalesTransaction {
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
  syncedToWebflow: boolean;
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

// Stock Management types
export interface StockAdjustment {
  id: string;
  type: StockAdjustmentType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  notes?: string;
  userId: string;
  productId?: string;
  variantId?: string;
  createdAt: Date;
}

export interface CreateStockAdjustmentData {
  type: StockAdjustmentType;
  quantity: number;
  reason: string;
  notes?: string;
  productId?: string;
  variantId?: string;
}

// Supplier types
export interface Supplier {
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
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Dashboard Analytics types
export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  todaySales: number;
  monthSales: number;
  pendingOrders: number;
  recentTransactions: SalesTransaction[];
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

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Inventory Management types
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
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

export interface AIContent {
  id: string;
  type: AIContentType;
  prompt: string;
  generatedText: string;
  status: ContentStatus;
  tone?: string;
  keywords: string[];
  isApproved: boolean;
  approvedAt?: Date;
  version: number;
  productId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Webflow Sync types
export interface WebflowSyncData {
  productId: string;
  name: string;
  description?: string;
  price: number;
  images?: string[];
  category: string;
  inStock: boolean;
  sku: string;
}

export interface WebflowSync {
  id: string;
  productId: string;
  webflowItemId?: string;
  status: WebflowSyncStatus;
  lastSyncAt?: Date;
  syncData?: any;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined;
}

// Table column definitions
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

// Dashboard Analytics types
export interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  todaySales: number;
  monthSales: number;
  pendingOrders: number;
  recentTransactions: SalesTransactionWithItems[];
}

// Search and Filter types
export interface ProductFilters {
  category?: string;
  supplier?: string;
  status?: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "DISCONTINUED";
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

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Inventory Management types
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  currentStock: number;
  minStock: number;
  maxStock?: number;
  status: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  value: number;
  lastUpdated: Date;
}

// AI Content types
export interface AIContentRequest {
  type:
    | "DESCRIPTION"
    | "SEO_TITLE"
    | "SEO_DESCRIPTION"
    | "SOCIAL_MEDIA_POST"
    | "PRODUCT_FEATURES"
    | "MARKETING_COPY";
  productId: string;
  tone?: string;
  keywords?: string[];
  prompt?: string;
}

// Webflow Sync types
export interface WebflowSyncData {
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
  [key: string]: string | undefined;
}

// Table column definitions
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
}

// Export commonly used Prisma types
export type { Prisma };
export type Product = Prisma.Product;
export type User = Prisma.User;
export type SalesTransaction = Prisma.SalesTransaction;
export type Supplier = Prisma.Supplier;
export type StockAdjustment = Prisma.StockAdjustment;
