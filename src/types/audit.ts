export enum AuditLogAction {
  // User actions
  USER_LOGIN = "USER_LOGIN",
  USER_LOGOUT = "USER_LOGOUT",
  USER_CREATED = "USER_CREATED",
  USER_UPDATED = "USER_UPDATED",
  USER_DELETED = "USER_DELETED",

  // Product actions
  PRODUCT_CREATED = "PRODUCT_CREATED",
  PRODUCT_UPDATED = "PRODUCT_UPDATED",
  PRODUCT_DELETED = "PRODUCT_DELETED",
  PRODUCT_ARCHIVED = "PRODUCT_ARCHIVED",
  PRODUCT_RESTORED = "PRODUCT_RESTORED",

  // Stock actions
  STOCK_ADDITION = "STOCK_ADDITION",
  STOCK_REMOVAL = "STOCK_REMOVAL",
  STOCK_ADJUSTMENT = "STOCK_ADJUSTMENT",
  STOCK_RECONCILIATION = "STOCK_RECONCILIATION",

  // Sales actions
  SALE_CREATED = "SALE_CREATED",
  SALE_UPDATED = "SALE_UPDATED",
  SALE_VOIDED = "SALE_VOIDED",
}

export interface AuditLogEntry {
  id: number;
  userId: number;
  action: AuditLogAction;
  tableName: string;
  recordId: number;
  oldValues: any;
  newValues: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}
