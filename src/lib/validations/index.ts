// Export all validation schemas
export * from "./common";
export * from "./product";
export * from "./user";
export * from "./supplier";
export * from "./sale";
export * from "./stock-adjustment";

// Re-export commonly used schemas for convenience
export {
  idSchema,
  paginationSchema,
  searchSchema,
  dateRangeSchema,
  validateRequest,
  formatZodError,
} from "./common";

export {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdSchema,
} from "./product";

export {
  createUserSchema,
  updateUserSchema,
  userQuerySchema,
  userIdSchema,
} from "./user";

export {
  createSupplierSchema,
  updateSupplierSchema,
  supplierQuerySchema,
  supplierIdSchema,
} from "./supplier";

export {
  createSaleSchema,
  updateSaleSchema,
  saleQuerySchema,
  saleIdSchema,
} from "./sale";

export {
  createStockAdjustmentSchema,
  updateStockAdjustmentSchema,
  stockAdjustmentQuerySchema,
  stockAdjustmentIdSchema,
} from "./stock-adjustment";
