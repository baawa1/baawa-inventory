# Finance Module Documentation

## Overview

The finance module is built around one rule: operational business activity is the primary source of truth, and manual finance entries are only for standalone items that do not duplicate those operational flows.

Current operational sources:
- POS sales are reported from `SalesTransaction` and related payment tables.
- Inventory purchase expense is reported from stock addition and supplier purchase records.
- Manual finance entries are stored in `FinancialTransaction`, `IncomeDetail`, and `ExpenseDetail`.

Current reporting model:
- All finance summary and reporting endpoints read through `src/lib/finance/aggregation.ts`.
- Legacy manual overlaps are flagged through the overlap audit and excluded from report totals.
- `/finance/reports` is the canonical reporting hub.

## Access Model

### Admin
- Full finance access.
- Can access `/finance`, `/finance/reports`, report child pages, analytics, forecasts, exports, and overlap audit.
- Can approve, reject, and delete finance transactions.

### Manager
- Can create manual income and expense transactions.
- Can review all finance transactions.
- Can reject pending transactions.
- Can edit only transactions they created, and only while the transaction is still mutable.
- Cannot access finance overview KPIs, reports, analytics, forecasts, exports, or overlap audit.

### Staff
- No finance access.

## Manual Entry Policy

Manual finance input is intentionally narrower than the full enum set in Prisma.

Allowed manual income sources:
- `SERVICES`
- `INVESTMENTS`
- `ROYALTIES`
- `COMMISSIONS`
- `OTHER`

Blocked manual income sources:
- `SALES`

Allowed manual expense types:
- `UTILITIES`
- `RENT`
- `SALARIES`
- `MARKETING`
- `OFFICE_SUPPLIES`
- `TRAVEL`
- `INSURANCE`
- `MAINTENANCE`
- `OTHER`

Blocked manual expense types:
- `INVENTORY_PURCHASES`

Why those categories are blocked:
- `SALES` must come from POS sales data.
- `INVENTORY_PURCHASES` must come from stock addition and purchase data.

Enforcement points:
- Form option lists on the client.
- Zod validation in `src/lib/validations/finance.ts`.
- Shared overlap policy in `src/lib/finance/manual-transaction-policy.ts`.

## Transaction Lifecycle

Manual transactions are created in `PENDING` state.

Lifecycle rules:
- `PENDING` transactions can be approved or rejected.
- Managers may reject pending transactions.
- Only admins may approve pending transactions.
- Admins may delete mutable transactions with a required reason.
- Approved, rejected, or cancelled transactions are not editable.

## Reporting Architecture

### Canonical Pages
- `/finance/reports`
- `/finance/reports/income-statement`
- `/finance/reports/expenses`
- `/finance/reports/cash-flow`
- `/finance/reports/analytics`
- `/finance/reports/overlap-audit`

### Removed / Deprecated Behavior
- The dynamic report detail surface at `/finance/reports/[id]` now redirects to the reports hub.
- The old `FinanceReports.tsx` reporting surface is no longer used.
- Report placeholders have been replaced with live pages or redirects back to the hub.

## Shared Aggregation

`src/lib/finance/aggregation.ts` normalizes three data sources into one reporting stream:
- `MANUAL`
- `POS_SALE`
- `STOCK_PURCHASE`

The aggregation layer is used by:
- `/api/finance/summary`
- `/api/finance/reports`
- `/api/finance/analytics`
- `/api/finance/advanced-analytics`
- `/api/finance/kpis`
- `/api/finance/profit-margins`
- `/api/finance/receivables`
- `/api/finance/cash-flow-forecast`
- `/api/finance/overlap-audit`

Key behaviors:
- Unified date-range handling.
- Unified income/expense totals.
- Payment-method summaries where the source supports payment method data.
- Legacy overlap filtering so blocked manual duplicates do not inflate totals.

## Overlap Audit

The overlap audit exists for historical cleanup, not day-to-day entry.

Route:
- `/finance/reports/overlap-audit`
- `/api/finance/overlap-audit`

What it does:
- Finds legacy manual entries that use blocked overlap categories.
- Groups them by category and amount.
- Exposes them to admins only.
- Keeps them out of summary/report totals until reviewed.

## Key Files

Access and policy:
- `src/lib/auth/roles.ts`
- `src/hooks/usePermissions.ts`
- `src/lib/finance/manual-transaction-policy.ts`

Aggregation:
- `src/lib/finance/aggregation.ts`

Core API routes:
- `src/app/api/finance/transactions/route.ts`
- `src/app/api/finance/transactions/[id]/route.ts`
- `src/app/api/finance/transactions/[id]/approve/route.ts`
- `src/app/api/finance/transactions/[id]/reject/route.ts`
- `src/app/api/finance/summary/route.ts`
- `src/app/api/finance/reports/route.ts`
- `src/app/api/finance/overlap-audit/route.ts`

Core UI surfaces:
- `src/components/finance/ReportsList.tsx`
- `src/components/finance/IncomeStatementReport.tsx`
- `src/components/finance/CashFlowReport.tsx`
- `src/components/finance/AnalyticsReportPage.tsx`
- `src/components/finance/OverlapAuditReport.tsx`

## Testing Focus

Priority finance tests should cover:
- Route authorization for admin vs manager vs staff.
- Manual overlap validation for `SALES` and `INVENTORY_PURCHASES`.
- Manager review access and own-only edit enforcement.
- Admin-only summary/report access.
- Shared aggregation consistency across finance endpoints.
- Overlap audit visibility and totals.
