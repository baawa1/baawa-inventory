import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DashboardTableColumn } from "@/components/layouts/DashboardColumnCustomizer";

// Improved type definitions for audit log values
interface AuditLogValues {
  [key: string]: string | number | boolean | null | undefined;
}

export type AuditLog = {
  id: number;
  created_at: string;
  users?: { email: string; firstName: string; lastName: string } | null;
  action: string;
  table_name: string;
  record_id: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
  old_values?: AuditLogValues | null;
  new_values?: AuditLogValues | null;
};

export const auditLogColumns: DashboardTableColumn[] = [
  { key: "created_at", label: "Date", required: true, defaultVisible: true },
  { key: "users", label: "User", required: true, defaultVisible: true },
  { key: "action", label: "Action", required: true, defaultVisible: true },
  { key: "table_name", label: "Table", required: false, defaultVisible: true },
  { key: "record_id", label: "Record", required: false, defaultVisible: false },
  { key: "ip_address", label: "IP", required: false, defaultVisible: false },
  {
    key: "user_agent",
    label: "User Agent",
    required: false,
    defaultVisible: false,
  },
  {
    key: "old_values",
    label: "Old Values",
    required: false,
    defaultVisible: false,
  },
  {
    key: "new_values",
    label: "New Values",
    required: false,
    defaultVisible: false,
  },
];

export function AuditLogTable({
  logs,
  visibleColumns,
}: {
  logs: AuditLog[];
  visibleColumns: string[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {auditLogColumns
            .filter((col) => visibleColumns.includes(col.key))
            .map((col) => (
              <TableHead key={col.key}>{col.label}</TableHead>
            ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={visibleColumns.length}
              className="text-center text-muted-foreground"
            >
              No audit logs found.
            </TableCell>
          </TableRow>
        ) : (
          logs.map((log) => (
            <TableRow key={log.id}>
              {visibleColumns.includes("created_at") && (
                <TableCell>
                  {new Date(log.created_at).toLocaleString()}
                </TableCell>
              )}
              {visibleColumns.includes("users") && (
                <TableCell>
                  {log.users
                    ? `${log.users.firstName} ${log.users.lastName} (${log.users.email})`
                    : "-"}
                </TableCell>
              )}
              {visibleColumns.includes("action") && (
                <TableCell>{log.action}</TableCell>
              )}
              {visibleColumns.includes("table_name") && (
                <TableCell>{log.table_name}</TableCell>
              )}
              {visibleColumns.includes("record_id") && (
                <TableCell>{log.record_id ?? "-"}</TableCell>
              )}
              {visibleColumns.includes("ip_address") && (
                <TableCell>{log.ip_address ?? "-"}</TableCell>
              )}
              {visibleColumns.includes("user_agent") && (
                <TableCell className="max-w-xs truncate">
                  {log.user_agent ?? "-"}
                </TableCell>
              )}
              {visibleColumns.includes("old_values") && (
                <TableCell className="max-w-xs truncate">
                  {log.old_values ? JSON.stringify(log.old_values) : "-"}
                </TableCell>
              )}
              {visibleColumns.includes("new_values") && (
                <TableCell className="max-w-xs truncate">
                  {log.new_values ? JSON.stringify(log.new_values) : "-"}
                </TableCell>
              )}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
