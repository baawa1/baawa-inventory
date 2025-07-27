import { AuditLogAction } from '@/types/audit';
import { prisma } from '@/lib/db';

interface AuditLogParams {
  tx?: any; // Prisma transaction
  userId: number;
  action: AuditLogAction;
  tableName: string;
  recordId: number;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Creates an audit log entry to track changes in the system
 * @param params Audit log parameters
 * @returns The created audit log entry
 */
export async function createAuditLog(params: AuditLogParams) {
  const {
    tx,
    userId,
    action,
    tableName,
    recordId,
    oldValues = {},
    newValues = {},
    ipAddress,
    userAgent,
  } = params;

  // Use the provided transaction object or fall back to the main prisma client
  const client = tx || prisma;

  return await client.auditLog.create({
    data: {
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
      ip_address: ipAddress,
      user_agent: userAgent,
    },
  });
}
