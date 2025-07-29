/**
 * Audit Constants
 * Shared constants for audit logs and admin activities
 */

export const AUDIT_ACTIONS = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  SALE_CREATED: 'SALE_CREATED',
} as const;

export const AUDIT_ACTION_COLORS = {
  [AUDIT_ACTIONS.CREATE]: 'bg-green-500',
  [AUDIT_ACTIONS.UPDATE]: 'bg-blue-500',
  [AUDIT_ACTIONS.DELETE]: 'bg-red-500',
  [AUDIT_ACTIONS.APPROVE]: 'bg-emerald-500',
  [AUDIT_ACTIONS.REJECT]: 'bg-orange-500',
  [AUDIT_ACTIONS.SALE_CREATED]: 'bg-purple-500',
} as const;

export const AUDIT_ACTION_LABELS = {
  [AUDIT_ACTIONS.CREATE]: 'Created new record',
  [AUDIT_ACTIONS.UPDATE]: 'Updated record',
  [AUDIT_ACTIONS.DELETE]: 'Deleted record',
  [AUDIT_ACTIONS.APPROVE]: 'Approved item',
  [AUDIT_ACTIONS.REJECT]: 'Rejected item',
  [AUDIT_ACTIONS.SALE_CREATED]: 'New sale',
} as const;

export const AUDIT_ACTIONS_TO_FILTER = [
  'LOGIN',
  'LOGOUT',
  'LOGIN_SUCCESS',
  'LOGIN_FAILED',
  'PASSWORD_RESET_REQUEST',
  'PASSWORD_RESET_SUCCESS',
] as const;

// Helper function to get color for an action
export const getAuditActionColor = (action: string): string => {
  return AUDIT_ACTION_COLORS[action as keyof typeof AUDIT_ACTION_COLORS] || 'bg-gray-500';
};

// Helper function to get label for an action
export const getAuditActionLabel = (action: string): string => {
  return AUDIT_ACTION_LABELS[action as keyof typeof AUDIT_ACTION_LABELS] || action;
}; 