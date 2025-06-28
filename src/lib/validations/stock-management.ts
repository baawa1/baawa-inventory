import { z } from "zod";

// Stock Addition Validation Schemas
export const createStockAdditionSchema = z.object({
  productId: z.number().int().positive(),
  supplierId: z.number().int().positive().optional(),
  quantity: z.number().int().positive(),
  costPerUnit: z.number().positive(),
  purchaseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  referenceNo: z.string().optional(),
});

export const updateStockAdditionSchema = z.object({
  supplierId: z.number().int().positive().optional(),
  quantity: z.number().int().positive().optional(),
  costPerUnit: z.number().positive().optional(),
  purchaseDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  referenceNo: z.string().optional(),
});

export const stockAdditionQuerySchema = z.object({
  productId: z.number().int().positive().optional(),
  supplierId: z.number().int().positive().optional(),
  createdBy: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z
    .enum(["createdAt", "purchaseDate", "quantity", "totalCost"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Stock Reconciliation Validation Schemas
export const reconciliationItemSchema = z.object({
  productId: z.number().int().positive(),
  systemCount: z.number().int().min(0),
  physicalCount: z.number().int().min(0),
  discrepancyReason: z.string().optional(),
  estimatedImpact: z.number().optional(),
  notes: z.string().optional(),
});

export const createStockReconciliationSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(reconciliationItemSchema).min(1),
});

export const updateStockReconciliationSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(reconciliationItemSchema).optional(),
});

export const stockReconciliationQuerySchema = z.object({
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]).optional(),
  createdBy: z.number().int().positive().optional(),
  approvedBy: z.number().int().positive().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  sortBy: z
    .enum(["createdAt", "updatedAt", "submittedAt", "approvedAt", "title"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const reconciliationActionSchema = z.object({
  action: z.enum(["submit", "approve", "reject"]),
  notes: z.string().optional(),
});

export const bulkReconciliationSchema = z.object({
  reconciliationIds: z.array(z.number().int().positive()).min(1),
  action: z.enum(["approve", "reject"]),
  notes: z.string().optional(),
});

// Type exports
export type CreateStockAdditionData = z.infer<typeof createStockAdditionSchema>;
export type UpdateStockAdditionData = z.infer<typeof updateStockAdditionSchema>;
export type StockAdditionQuery = z.infer<typeof stockAdditionQuerySchema>;

export type ReconciliationItem = z.infer<typeof reconciliationItemSchema>;
export type CreateStockReconciliationData = z.infer<
  typeof createStockReconciliationSchema
>;
export type UpdateStockReconciliationData = z.infer<
  typeof updateStockReconciliationSchema
>;
export type StockReconciliationQuery = z.infer<
  typeof stockReconciliationQuerySchema
>;
export type ReconciliationAction = z.infer<typeof reconciliationActionSchema>;
export type BulkReconciliationAction = z.infer<typeof bulkReconciliationSchema>;
