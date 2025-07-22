// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  success: boolean;
  message?: string;
}

// Product API Types
export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock: number | null;
  unit: string;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "DISCONTINUED";
  image: string | null;
  images: Array<{ id: number; url: string; alt?: string }> | string[];
  categoryId: number | null;
  brandId: number | null;
  supplierId: number | null;
  category: {
    id: number;
    name: string;
  } | null;
  brand: {
    id: number;
    name: string;
  } | null;
  supplier: {
    id: number;
    name: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  sku: string;
  barcode?: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  maxStock?: number;
  unit: string;
  status: "ACTIVE" | "INACTIVE" | "OUT_OF_STOCK" | "DISCONTINUED";
  imageUrl?: string;
  categoryId?: number;
  brandId?: number;
  supplierId?: number;
  notes?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: number;
}

// Category API Types
export interface CategoryResponse {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: number;
}

// Brand API Types
export interface BrandResponse {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandRequest {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateBrandRequest extends Partial<CreateBrandRequest> {
  id: number;
}

// Supplier API Types
export interface SupplierResponse {
  id: number;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  website: string | null;
  taxNumber: string | null;
  paymentTerms: string | null;
  creditLimit: number | null;
  isActive: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  website?: string;
  taxNumber?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive: boolean;
  notes?: string;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  id: number;
}

// Stock Reconciliation API Types
export interface StockReconciliationResponse {
  id: number;
  title: string;
  description: string | null;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  approvedAt: string | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  approvedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
  items: StockReconciliationItemResponse[];
}

export interface StockReconciliationItemResponse {
  id: number;
  systemCount: number;
  physicalCount: number;
  discrepancy: number;
  discrepancyReason: string | null;
  estimatedImpact: number | null;
  product: {
    id: number;
    name: string;
    sku: string;
  };
}

export interface CreateStockReconciliationRequest {
  title: string;
  description?: string;
  items: {
    productId: number;
    systemCount: number;
    physicalCount: number;
    discrepancyReason?: string;
  }[];
  notes?: string;
}

export interface UpdateStockReconciliationRequest
  extends Partial<CreateStockReconciliationRequest> {
  id: number;
}

// User API Types
export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "MANAGER" | "STAFF";
  status: "PENDING" | "VERIFIED" | "APPROVED" | "REJECTED" | "SUSPENDED";
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  name?: string;
  role: "ADMIN" | "MANAGER" | "STAFF";
  password: string;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: string;
}

// Query Parameters
export interface ProductQueryParams {
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
  supplier?: string;
  lowStock?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface CategoryQueryParams {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface SupplierQueryParams {
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface StockReconciliationQueryParams {
  search?: string;
  status?: string;
  createdBy?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// API Method Types
export type ApiMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export interface ApiRequestConfig {
  method: ApiMethod;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
}

// Error Response Types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: ValidationError[];
  code?: string;
  details?: unknown;
}
