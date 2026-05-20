# Finance Module Documentation

## Overview

Start here:

- [How Finance Should Work](./how-finance-should-work.md)

That document is now the primary business explanation for the finance system. It explains the finance logic in plain language and defines the current source-of-truth rules for profit, cash movement, and business position.

The rest of this README is technical reference and implementation history.

The finance module is built around one rule: operational business activity is the primary source of truth, and manual finance entries are only for standalone items that do not duplicate those operational flows.

Current operational sources:
- POS sales are reported from `SalesTransaction` and related payment tables.
- Cost of goods sold uses `SalesItem` cost-at-sale snapshots when present; older rows without snapshots are estimated and flagged.
- Inventory purchase reporting is derived from `StockAddition` records and their supplier-linked purchase details where available.
- Manual finance entries are stored in `FinancialTransaction`, `IncomeDetail`, and `ExpenseDetail`.

Current reporting model:
- All finance summary and reporting endpoints read through `src/lib/finance/ledger.ts`.
- Legacy manual overlaps are flagged through the overlap audit and excluded from report totals.
- `/finance/reports` is the canonical reporting hub.

## Access Model

### Admin
- Full finance access.
- Can access `/finance`, `/finance/reports`, report child pages, analytics, forecasts, exports, and overlap audit.
- Can delete finance transactions.

### Manager
- Can create manual income and expense transactions.
- Can review all finance transactions.
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

Manual transactions are created in `COMPLETED` state.

Lifecycle rules:
- Manual income and expense entries are created in `COMPLETED` state.
- `PENDING` and `COMPLETED` manual entries remain editable while they are mutable.
- Admins may delete manual transactions with a required reason.
- `APPROVED`, `REJECTED`, and `CANCELLED` transactions are not editable.
- Historical records may still contain older approval statuses, but the current product no longer uses that workflow.

## Reporting Architecture

### Canonical Pages
- `/finance/reports`
- `/finance/reports/income-statement`
- `/finance/reports/cash-flow`
- `/finance/reports/analytics`
- `/finance/reports/overlap-audit`

### Compatibility Redirects
- `/finance/reports/expenses` now redirects to `/finance/reports/analytics`.

### Snapshot History
- Saved report snapshots are stored in `FinancialReport`.
- The reports hub loads snapshot history from `/api/finance/reports/history`.
- `/finance/reports/[id]` reopens a saved report snapshot without recalculating it.
- `/api/finance/reports/compare` compares two saved snapshots and returns grouped deltas for trading, cash movement, business position, and summary figures.
- Active snapshot types in this phase are:
  - `FINANCIAL_SUMMARY`
  - `INCOME_STATEMENT`
  - `CASH_FLOW`
- Snapshots are JSON-backed for auditability and re-opened comparison, not PDF-backed in this phase.

### Removed / Deprecated Behavior
- The standalone expense report page no longer exists as its own reporting product.
- The older KPI, advanced analytics, and profit-margin micro-surfaces have been folded into the analytics page.
- Older finance rewrite notes in the repository should be treated as historical/reference material if they disagree with `how-finance-should-work.md`.

## Shared Aggregation

`src/lib/finance/ledger.ts` is the canonical finance event model.

It normalizes operational and manual sources into one ledger with explicit effects for:

- cash
- profit
- inventory value
- receivables

Current source groups:
- `MANUAL`
- `POS`
- `STOCK`

The aggregation layer is used by:
- `/api/finance/summary`
- `/api/finance/reports`
- `/api/finance/reports/history`
- `/api/finance/analytics`
- `/api/finance/receivables`
- `/api/finance/cash-flow-forecast`
- `/api/finance/overlap-audit`

Key behaviors:
- Unified date-range handling.
- One master finance ledger used by summary, reports, analytics, receivables, and `/finance/transactions`.
- Stock purchases affect cash and inventory, not immediate profit.
- Owner funding affects cash, not profit.
- Debt sales recognise only collected cash as income while moving unpaid balances into receivables.
- Legacy overlap filtering so blocked manual duplicates do not inflate report totals.

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

Ledger and calculations:
- `src/lib/finance/ledger.ts`
- `src/lib/finance/metrics.ts`

Core API routes:
- `src/app/api/finance/transactions/route.ts`
- `src/app/api/finance/transactions/[id]/route.ts`
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
