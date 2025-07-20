"use client";
import * as React from "react";
import { auditLogColumns, AuditLog } from "@/components/admin/AuditLogTable";
import { PageTitle } from "@/components/ui/page-title";
import { DashboardTableLayout } from "@/components/layouts/DashboardTableLayout";
import { FilterConfig } from "@/components/layouts/DashboardFiltersBar";
import { useAuditLogs } from "@/hooks/api/audit-logs";

export default function AuditLogsPage() {
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
  const initialUserId = searchParams?.get("userId") || "";

  const [page, setPage] = React.useState(1);
  const [user, setUser] = React.useState(initialUserId);
  const [action, setAction] = React.useState("");
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [pageSize, setPageSize] = React.useState(10);
  const [visibleColumns, setVisibleColumns] = React.useState(() =>
    auditLogColumns.filter((c) => c.required).map((c) => c.key)
  );

  // Use TanStack Query hook instead of useEffect+fetch
  const {
    data,
    isLoading: loading,
    error,
  } = useAuditLogs({
    page,
    limit: pageSize,
    userId: user || undefined,
    action: action || undefined,
    from: from || undefined,
    to: to || undefined,
  });

  const logs = data?.logs || [];
  const totalPages = data?.totalPages || 1;

  // Handle errors (TanStack Query will show error in console, but we can add user-friendly handling)
  if (error) {
    console.error("Error fetching audit logs:", error);
  }

  // Filters config for DashboardFiltersBar
  const filters: FilterConfig[] = [
    {
      key: "user",
      label: "User ID",
      type: "text",
      placeholder: "User ID",
    },
    {
      key: "action",
      label: "Action",
      type: "text",
      placeholder: "Action",
    },
    {
      key: "from",
      label: "From",
      type: "text",
      placeholder: "From (YYYY-MM-DD)",
    },
    {
      key: "to",
      label: "To",
      type: "text",
      placeholder: "To (YYYY-MM-DD)",
    },
  ];
  const filterValues = { user, action, from, to };
  const onFilterChange = (key: string, value: string) => {
    if (key === "user" && user !== value) setUser(value);
    if (key === "action" && action !== value) setAction(value);
    if (key === "from" && from !== value) setFrom(value);
    if (key === "to" && to !== value) setTo(value);
    setPage(1);
  };
  const onResetFilters = () => {
    setUser("");
    setAction("");
    setFrom("");
    setTo("");
    setPage(1);
  };

  // Table cell renderer
  const renderCell = (log: AuditLog, columnKey: string) => {
    switch (columnKey) {
      case "created_at":
        return new Date(log.created_at).toLocaleString();
      case "users":
        return log.users
          ? `${log.users.firstName} ${log.users.lastName} (${log.users.email})`
          : "-";
      case "action":
        return log.action;
      case "table_name":
        return log.table_name;
      case "record_id":
        return log.record_id ?? "-";
      case "ip_address":
        return log.ip_address ?? "-";
      case "user_agent":
        return log.user_agent ?? "-";
      case "old_values":
        return log.old_values ? JSON.stringify(log.old_values) : "-";
      case "new_values":
        return log.new_values ? JSON.stringify(log.new_values) : "-";
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-6 px-4 lg:px-6">
      <PageTitle
        title="Audit Logs"
        description="View and filter all system audit logs and user activity."
      />
      <DashboardTableLayout
        title="Audit Logs"
        description="View and filter all system audit logs and user activity."
        filters={filters}
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
        columns={auditLogColumns}
        visibleColumns={visibleColumns}
        onColumnsChange={setVisibleColumns}
        columnCustomizerKey="audit-log-columns"
        data={logs}
        renderCell={renderCell}
        pagination={{
          page,
          limit: pageSize,
          totalPages,
          totalItems: totalPages * pageSize, // You may want to update this if you have total count
        }}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        isLoading={loading}
        emptyStateMessage="No audit logs found."
        tableTitle="Audit Log Results"
      />
    </div>
  );
}
