import { AuditLogAction } from '@/types/audit';
import { prisma } from '@/lib/db';
import { PrismaClient, Prisma } from '@prisma/client';

// ===== TYPE DEFINITIONS =====

export type AuditValues = Prisma.InputJsonValue;

export type AuditValuesOrNull = AuditValues | null;

type AuditLogClient = Pick<PrismaClient, 'auditLog'>;

export interface AuditLogParams {
  tx?: AuditLogClient;
  userId?: number | null;
  action: AuditLogAction | string;
  tableName: string;
  recordId?: number | null;
  oldValues?: unknown | null;
  newValues?: unknown | null;
  ipAddress?: string;
  userAgent?: string;
}

function normalizeAuditValue(value: unknown): AuditValuesOrNull {
  if (value === null) {
    return null;
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(item => normalizeAuditValue(item)) as Prisma.InputJsonArray;
  }

  if (typeof value === 'object') {
    const maybeSerializable = value as { toJSON?: () => unknown };
    if (typeof maybeSerializable.toJSON === 'function') {
      const serializedValue = maybeSerializable.toJSON();
      if (serializedValue !== value) {
        return normalizeAuditValue(serializedValue);
      }
    }

    const normalizedEntries = Object.entries(value).reduce<
      [string, AuditValuesOrNull][]
    >((entries, [key, entryValue]) => {
      if (typeof entryValue === 'undefined') {
        return entries;
      }

      entries.push([key, normalizeAuditValue(entryValue)]);
      return entries;
    }, []);

    return Object.fromEntries(normalizedEntries) as Prisma.InputJsonObject;
  }

  return String(value);
}

function normalizeAuditFieldInput(
  value: unknown
): Prisma.NullableJsonNullValueInput | AuditValues {
  const normalizedValue = normalizeAuditValue(value);
  return normalizedValue === null ? Prisma.DbNull : normalizedValue;
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
    oldValues,
    newValues,
    ipAddress,
    userAgent,
  } = params;

  // Use the provided transaction object or fall back to the main prisma client
  const client = tx || prisma;

  return await client.auditLog.create({
    data: {
      user_id: userId ?? null,
      action,
      table_name: tableName,
      record_id: recordId ?? null,
      old_values:
        typeof oldValues === 'undefined'
          ? undefined
          : normalizeAuditFieldInput(oldValues),
      new_values:
        typeof newValues === 'undefined'
          ? undefined
          : normalizeAuditFieldInput(newValues),
      ip_address: ipAddress,
      user_agent: userAgent,
    },
  });
}
