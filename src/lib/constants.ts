/**
 * Application Constants
 * Centralized constants to prevent magic strings and inconsistencies
 * All constants must match the exact Prisma ENUM values
 */

import { USER_ROLES } from "@/lib/auth/roles";
import {
  IconCash,
  IconCreditCard,
  IconBuilding,
  IconWallet,
} from "@tabler/icons-react";

// User Status Constants (must match Prisma UserStatus enum exactly)
export const USER_STATUS = {
  PENDING: "PENDING",
  VERIFIED: "VERIFIED",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

// Valid user statuses for POS access
export const POS_ALLOWED_STATUSES: UserStatus[] = [USER_STATUS.APPROVED];

// Product Status Constants (must match validation schema exactly)
export const PRODUCT_STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  OUT_OF_STOCK: "OUT_OF_STOCK",
  DISCONTINUED: "DISCONTINUED",
} as const;

export type ProductStatus =
  (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

// Payment Methods (must match Prisma PaymentMethod enum exactly)
export const PAYMENT_METHODS = {
  CASH: "CASH",
  BANK_TRANSFER: "BANK_TRANSFER",
  POS_MACHINE: "POS_MACHINE",
  CREDIT_CARD: "CREDIT_CARD",
  MOBILE_MONEY: "MOBILE_MONEY",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const ALL_PAYMENT_METHODS: PaymentMethod[] =
  Object.values(PAYMENT_METHODS);

// Payment Methods with UI data (for components)
export const PAYMENT_METHODS_UI = [
  { value: PAYMENT_METHODS.CASH, label: "Cash", icon: IconCash },
  {
    value: PAYMENT_METHODS.POS_MACHINE,
    label: "POS Machine",
    icon: IconCreditCard,
  },
  {
    value: PAYMENT_METHODS.BANK_TRANSFER,
    label: "Bank Transfer",
    icon: IconBuilding,
  },
  {
    value: PAYMENT_METHODS.CREDIT_CARD,
    label: "Credit Card",
    icon: IconCreditCard,
  },
  {
    value: PAYMENT_METHODS.MOBILE_MONEY,
    label: "Mobile Money",
    icon: IconWallet,
  },
] as const;

// Payment Status Constants (must match Prisma PaymentStatus enum exactly)
export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  PAID: "PAID",
  REFUNDED: "REFUNDED",
  CANCELLED: "CANCELLED",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

// Discount Type Constants (must match Prisma DiscountType enum exactly)
export const DISCOUNT_TYPE = {
  AMOUNT: "AMOUNT",
  PERCENTAGE: "PERCENTAGE",
} as const;

export type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE];

// Stock Reconciliation Status (must match Prisma StockReconciliationStatus enum exactly)
export const STOCK_RECONCILIATION_STATUS = {
  DRAFT: "DRAFT",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type StockReconciliationStatus =
  (typeof STOCK_RECONCILIATION_STATUS)[keyof typeof STOCK_RECONCILIATION_STATUS];

// Stock Adjustment Types (must match Prisma StockAdjustmentType enum exactly)
export const STOCK_ADJUSTMENT_TYPES = {
  INCREASE: "INCREASE",
  DECREASE: "DECREASE",
  RECOUNT: "RECOUNT",
  DAMAGE: "DAMAGE",
  TRANSFER: "TRANSFER",
  RETURN: "RETURN",
} as const;

export type StockAdjustmentType =
  (typeof STOCK_ADJUSTMENT_TYPES)[keyof typeof STOCK_ADJUSTMENT_TYPES];

// Purchase Order Status (must match actual database values)
export const PURCHASE_ORDER_STATUS = {
  DRAFT: "draft",
  PENDING: "pending",
  APPROVED: "approved",
  ORDERED: "ordered",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type PurchaseOrderStatus =
  (typeof PURCHASE_ORDER_STATUS)[keyof typeof PURCHASE_ORDER_STATUS];

// AI Content Type (must match Prisma AIContentType enum exactly)
export const AI_CONTENT_TYPE = {
  DESCRIPTION: "DESCRIPTION",
  SEO_TITLE: "SEO_TITLE",
  SEO_DESCRIPTION: "SEO_DESCRIPTION",
  SOCIAL_MEDIA_POST: "SOCIAL_MEDIA_POST",
  PRODUCT_FEATURES: "PRODUCT_FEATURES",
  MARKETING_COPY: "MARKETING_COPY",
} as const;

export type AIContentType =
  (typeof AI_CONTENT_TYPE)[keyof typeof AI_CONTENT_TYPE];

// Content Status (must match Prisma ContentStatus enum exactly)
export const CONTENT_STATUS = {
  DRAFT: "DRAFT",
  PENDING_APPROVAL: "PENDING_APPROVAL",
  APPROVED: "APPROVED",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
} as const;

export type ContentStatus =
  (typeof CONTENT_STATUS)[keyof typeof CONTENT_STATUS];

// Webflow Sync Status (must match Prisma WebflowSyncStatus enum exactly)
export const WEBFLOW_SYNC_STATUS = {
  PENDING: "PENDING",
  SYNCING: "SYNCING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  RETRY: "RETRY",
} as const;

export type WebflowSyncStatus =
  (typeof WEBFLOW_SYNC_STATUS)[keyof typeof WEBFLOW_SYNC_STATUS];

// API Limits and Pagination
export const API_LIMITS = {
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE_SIZE: 10,
  PRODUCT_SEARCH_LIMIT: 20,
  TRANSACTION_HISTORY_LIMIT: 50,
  LOW_STOCK_DISPLAY_LIMIT: 10,
  TOP_CUSTOMERS_LIMIT: 5,
  TOP_CATEGORIES_LIMIT: 5,
  TOP_PRODUCTS_LIMIT: 5,
  SALES_CHART_DAYS: 30,
} as const;

// Stock Thresholds
export const STOCK_THRESHOLDS = {
  CRITICAL_STOCK: 0,
  LOW_STOCK_DEFAULT: 10,
  MIN_STOCK_DEFAULT: 5,
  MAX_STOCK_DEFAULT: 1000,
} as const;

// Date Range Options
export const DATE_RANGES = {
  WEEK: "week",
  MONTH: "month",
  YEAR: "year",
} as const;

// Chart Configuration
export const CHART_CONFIG = {
  COLORS: [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#f97316", // orange
  ],
  HEIGHT: 300,
  STROKE_WIDTH: 2,
} as const;

// Transaction Prefixes
export const TRANSACTION_PREFIXES = {
  POS: "POS",
  MANUAL: "TXN",
  IMPORT: "IMP",
} as const;

// Cache Durations (in milliseconds)
export const CACHE_DURATIONS = {
  PRODUCTS: 5 * 60 * 1000, // 5 minutes
  USER_SESSION: 60 * 1000, // 1 minute
  TRANSACTION_HISTORY: 2 * 60 * 1000, // 2 minutes
  QUERY_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  QUERY_GC_TIME: 10 * 60 * 1000, // 10 minutes
} as const;

// Polling and Refresh Intervals (in milliseconds)
export const INTERVALS = {
  SESSION_MONITOR: 120000, // 2 minutes
  SESSION_CHECK_MIN: 60000, // 1 minute
  STATS_UPDATE: 30000, // 30 seconds
  STATS_REFRESH: 60000, // 1 minute
  OFFLINE_SYNC: 30000, // 30 seconds
} as const;

// Currency Settings
export const CURRENCY = {
  SYMBOL: "₦",
  CODE: "NGN",
  DECIMAL_PLACES: 2,
} as const;

// Barcode Patterns
export const BARCODE_PATTERNS = {
  EAN13: /^\d{13}$/,
  EAN8: /^\d{8}$/,
  UPC: /^\d{12}$/,
  CODE128: /^[a-zA-Z0-9\-._\$\/\+%]+$/,
} as const;

// Email Templates
export const EMAIL_TEMPLATES = {
  RECEIPT: "receipt",
  USER_APPROVAL: "user_approval",
  USER_REJECTION: "user_rejection",
  PASSWORD_RESET: "password_reset",
} as const;

// File Upload Limits
export const UPLOAD_LIMITS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
  MAX_FILES_PER_UPLOAD: 10,
} as const;

// Stock Alert Thresholds
export const STOCK_ALERTS = {
  LOW_STOCK_THRESHOLD: 10,
  OUT_OF_STOCK_THRESHOLD: 0,
  CRITICAL_STOCK_THRESHOLD: 5,
} as const;

// Session Settings
export const SESSION_SETTINGS = {
  MAX_AGE: 24 * 60 * 60, // 24 hours in seconds
  UPDATE_AGE: 60 * 60, // 1 hour in seconds
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NAME_LENGTH: 255,
  MAX_EMAIL_LENGTH: 255,
  MAX_PHONE_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_PRICE: 0.01,
  MAX_PRICE: 1000000, // 1 million Naira
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 10000,
  MIN_STOCK_THRESHOLD: 5,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "Insufficient permissions",
  NOT_FOUND: "Resource not found",
  VALIDATION_ERROR: "Invalid data provided",
  INTERNAL_ERROR: "Internal server error",
  NETWORK_ERROR: "Network connection error",
  SESSION_EXPIRED: "Session has expired",
  ACCOUNT_INACTIVE: "Account is not active",
  INSUFFICIENT_STOCK: "Insufficient stock available",
  PAYMENT_FAILED: "Payment processing failed",
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SALE_COMPLETED: "Sale completed successfully",
  PRODUCT_ADDED: "Product added to cart",
  PRODUCT_UPDATED: "Product updated successfully",
  USER_APPROVED: "User approved successfully",
  EMAIL_SENT: "Email sent successfully",
  DATA_SYNCED: "Data synchronized successfully",
} as const;

// Note: User Role Constants are defined in @/lib/auth/roles.ts

// Default Values
export const DEFAULTS = {
  USER_ROLE: USER_ROLES.STAFF,
  USER_STATUS: USER_STATUS.PENDING,
  PRODUCT_STATUS: PRODUCT_STATUS.ACTIVE,
  PAYMENT_METHOD: PAYMENT_METHODS.CASH,
  CURRENCY_CODE: CURRENCY.CODE,
  PAGE_SIZE: API_LIMITS.DEFAULT_PAGE_SIZE,
} as const;

// Placeholder Values for Development
export const PLACEHOLDER_VALUES = {
  VISITOR_COUNT: "999",
  VIEW_COUNT: "1,333",
  DISCOUNTED_ORDERS: "0",
  DISCOUNT_CHANGE: "0%",
  VISITOR_CHANGE: "0%",
  VIEW_CHANGE: "0%",
} as const;
