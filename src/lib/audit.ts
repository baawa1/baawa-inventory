import { AuditLogAction } from '@/types/audit';
import { prisma } from '@/lib/db';
import { PrismaClient, Prisma } from '@prisma/client';

// ===== TYPE DEFINITIONS =====

export type AuditValues = Prisma.InputJsonValue;

export type AuditValuesOrNull = AuditValues | null;

export interface AuditLogParams {
  tx?: Omit<
    PrismaClient,
    '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
  >;
  userId: number;
  action: AuditLogAction;
  tableName: string;
  recordId: number;
  oldValues?: AuditValuesOrNull;
  newValues?: AuditValuesOrNull;
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
      old_values: oldValues ?? undefined,
      new_values: newValues ?? undefined,
      ip_address: ipAddress,
      user_agent: userAgent,
    },
  });
}
