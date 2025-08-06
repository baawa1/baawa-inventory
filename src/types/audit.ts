export enum AuditLogAction {
  // User actions
  _USER_LOGIN = 'USER_LOGIN',
  _USER_LOGOUT = 'USER_LOGOUT',
  _USER_CREATED = 'USER_CREATED',
  _USER_UPDATED = 'USER_UPDATED',
  _USER_DELETED = 'USER_DELETED',

  // Product actions
  _PRODUCT_CREATED = 'PRODUCT_CREATED',
  _PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  _PRODUCT_DELETED = 'PRODUCT_DELETED',
  _PRODUCT_ARCHIVED = 'PRODUCT_ARCHIVED',
  _PRODUCT_RESTORED = 'PRODUCT_RESTORED',

  // Stock actions
  _STOCK_ADDITION = 'STOCK_ADDITION',
  _STOCK_REMOVAL = 'STOCK_REMOVAL',
  _STOCK_ADJUSTMENT = 'STOCK_ADJUSTMENT',
  _STOCK_RECONCILIATION = 'STOCK_RECONCILIATION',

  // Sales actions
  _SALE_CREATED = 'SALE_CREATED',
  _SALE_UPDATED = 'SALE_UPDATED',
  _SALE_VOIDED = 'SALE_VOIDED',
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
