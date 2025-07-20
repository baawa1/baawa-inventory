/**
 * Application Constants
 * Centralized constants to prevent magic strings and inconsistencies
 */

import { USER_ROLES } from "@/lib/auth/roles";
import {
  IconCash,
  IconCreditCard,
  IconBuilding,
  IconWallet,
} from "@tabler/icons-react";

// User Status Constants (must match database schema)
export const USER_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  ACTIVE: "APPROVED", // Alias for backwards compatibility
  VERIFIED: "VERIFIED",
  REJECTED: "REJECTED",
  INACTIVE: "INACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

// Valid user statuses for POS access
export const POS_ALLOWED_STATUSES: UserStatus[] = [
  USER_STATUS.APPROVED,
  USER_STATUS.VERIFIED,
];

// Payment Methods (must match database enum)
export const PAYMENT_METHODS = {
  CASH: "cash",
  POS: "pos",
  BANK_TRANSFER: "bank_transfer",
  MOBILE_MONEY: "mobile_money",
} as const;

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export const ALL_PAYMENT_METHODS: PaymentMethod[] =
  Object.values(PAYMENT_METHODS);

// Payment Methods with UI data (for components)
export const PAYMENT_METHODS_UI = [
  { value: PAYMENT_METHODS.CASH, label: "Cash", icon: IconCash },
  { value: PAYMENT_METHODS.POS, label: "POS Machine", icon: IconCreditCard },
  {
    value: PAYMENT_METHODS.BANK_TRANSFER,
    label: "Bank Transfer",
    icon: IconBuilding,
  },
  {
    value: PAYMENT_METHODS.MOBILE_MONEY,
    label: "Mobile Money",
    icon: IconWallet,
  },
] as const;

// Payment Status Constants (must match database schema)
export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  COMPLETED: "completed",
  FAILED: "failed",
  REFUNDED: "refunded",
  CANCELLED: "cancelled",
} as const;

export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

// Product Status Constants
export const PRODUCT_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  DISCONTINUED: "discontinued",
} as const;

export type ProductStatus =
  (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];

// Transaction Status Constants
export const TRANSACTION_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
} as const;

export type TransactionStatus =
  (typeof TRANSACTION_STATUS)[keyof typeof TRANSACTION_STATUS];

// Stock Adjustment Types
export const STOCK_ADJUSTMENT_TYPES = {
  INCREASE: "INCREASE",
  DECREASE: "DECREASE",
  CORRECTION: "CORRECTION",
} as const;

export type StockAdjustmentType =
  (typeof STOCK_ADJUSTMENT_TYPES)[keyof typeof STOCK_ADJUSTMENT_TYPES];

// Stock Adjustment Status Constants
export const STOCK_ADJUSTMENT_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type StockAdjustmentStatus =
  (typeof STOCK_ADJUSTMENT_STATUS)[keyof typeof STOCK_ADJUSTMENT_STATUS];

// API Response Limits
export const API_LIMITS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  PRODUCT_SEARCH_LIMIT: 50,
  TRANSACTION_HISTORY_LIMIT: 50,
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
  MAX_NAME_LENGTH: 100,
  MAX_EMAIL_LENGTH: 255,
  MAX_PHONE_LENGTH: 20,
  MAX_DESCRIPTION_LENGTH: 1000,
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999.99,
  MIN_QUANTITY: 1,
  MAX_QUANTITY: 9999,
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
