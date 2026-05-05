# Test Inventory

This document is the single source of truth for test coverage across the app. It maps features to UI routes, API routes, critical rules, and required test types.

## Definition of Done
- Unit tests cover core validations/utilities (Zod schemas, calculations, permissions).
- Integration tests cover API handler logic (request validation, permission checks, response shape).
- E2E tests cover a user-facing flow with a happy path and one failure path.
- Status is updated for each feature row.

## Auth & Access

| Feature | UI Routes | API Routes | Critical Rules / Validations | Test Types | Status |
| --- | --- | --- | --- | --- | --- |
| Authentication entrypoints | `/login`, `/logout`, `/logout/immediate` | `/api/auth/:...nextauth` | Password policy, session creation, login-only access | Unit, Integration, E2E | In Progress |
| Password reset | `/forgot-password`, `/reset-password` | `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/auth/validate-reset-token` | Token expiry, password policy, error handling | Unit, Integration, E2E | Not Started |
| Session refresh | (none) | `/api/auth/refresh-session` | Role status, refresh timing, error responses | Unit, Integration | In Progress |
| Access gating | `/unauthorized` | (none) | Inactive/unapproved account redirects | Unit, E2E | In Progress |
| Account profile | `/account` | `/api/users/profile`, `/api/users/change-password` | Profile updates, password change validation | Unit, Integration, E2E | Not Started |

## Admin & Users

| Feature | UI Routes | API Routes | Critical Rules / Validations | Test Types | Status |
| --- | --- | --- | --- | --- | --- |
| Admin dashboard | `/admin` | `/api/admin/activity`, `/api/admin/settings` | Admin-only access | Unit, Integration, E2E | Not Started |
| User management | `/admin` | `/api/users`, `/api/users/:id` | Role-based access, updates, deletions | Unit, Integration, E2E | Not Started |
| User access workflows | `/admin` | `/api/admin/suspend-user` | Status transitions, audit logs | Unit, Integration, E2E | Not Started |
| Audit logs | `/audit-logs`, `/audit-logs/mobile` | `/api/admin/activity` | Filtering, paging, admin-only access | Unit, Integration, E2E | Not Started |
| Admin email test | `/admin` | `/api/admin/test-email` | Delivery handling, error paths | Unit, Integration | Not Started |

## POS

| Feature | UI Routes | API Routes | Critical Rules / Validations | Test Types | Status |
| --- | --- | --- | --- | --- | --- |
| POS checkout | `/pos` | `/api/pos/create-sale`, `/api/pos/transactions`, `/api/pos/split-payments/:transactionId` | Totals, discounts, split payments, role access | Unit, Integration, E2E | Not Started |
| Products search & scan | `/pos` | `/api/pos/products`, `/api/pos/search-products`, `/api/pos/barcode-lookup` | Query filters, barcode lookup errors | Unit, Integration, E2E | Not Started |
| Receipts & reprint | `/pos/history` | `/api/pos/print-receipt`, `/api/pos/receipts/:transactionId/reprint`, `/api/pos/email-receipt` | Receipt generation, email delivery | Unit, Integration, E2E | Not Started |
| Customers | `/pos/customers`, `/pos/customers/all`, `/pos/customers/manage` | `/api/pos/customers`, `/api/pos/customers/:email`, `/api/pos/customers/:email/purchases`, `/api/pos/customers/check-unique` | Uniqueness, updates, purchase history | Unit, Integration, E2E | Not Started |
| Coupons | `/pos/coupons`, `/pos/coupons/create` | `/api/pos/coupons`, `/api/pos/coupons/:id`, `/api/pos/coupons/:id/toggle`, `/api/pos/coupons/validate` | Expiry, limits, discount math | Unit, Integration, E2E | Not Started |
| POS analytics | `/pos/analytics`, `/pos/analytics/categories`, `/pos/analytics/products`, `/pos/analytics/sales`, `/pos/daily-orders/:date` | `/api/pos/analytics/overview`, `/api/pos/analytics/categories`, `/api/pos/analytics/products`, `/api/pos/analytics/products/export`, `/api/pos/analytics/customers`, `/api/pos/analytics/customers/:email/orders`, `/api/pos/analytics/daily-orders` | Date ranges, export behavior | Unit, Integration, E2E | Not Started |
| Sales endpoints (legacy) | (none) | `/api/sales`, `/api/sales/:id`, `/api/sales/:id/payments`, `/api/sales/stats` | Payment updates, status transitions | Unit, Integration | Not Started |

## Finance

| Feature | UI Routes | API Routes | Critical Rules / Validations | Test Types | Status |
| --- | --- | --- | --- | --- | --- |
| Finance overview | `/finance` | `/api/finance/summary` | Admin-only KPI access, shared aggregation ranges | Unit, Integration, E2E | In Progress |
| Transactions CRUD | `/finance/transactions`, `/finance/transactions/:id`, `/finance/transactions/:id/edit` | `/api/finance/transactions`, `/api/finance/transactions/:id` | Manager review access, manager own-only edit, pagination, mutable-state rules | Unit, Integration, E2E | In Progress |
| Approvals & rejections | `/finance/transactions/:id` | `/api/finance/transactions/:id/approve`, `/api/finance/transactions/:id/reject` | Admin-only approval, manager/admin rejection, pending-only transitions, audit logs | Unit, Integration, E2E | In Progress |
| Income & expense entry | `/finance/income`, `/finance/income/new`, `/finance/income/:id/edit`, `/finance/expenses`, `/finance/expenses/new`, `/finance/expenses/:id/edit` | `/api/finance/transactions` | Block manual `SALES` and `INVENTORY_PURCHASES`, status defaults, validation parity between UI and API | Unit, Integration, E2E | In Progress |
| Reports hub & export | `/finance/reports` | `/api/finance/reports` | Admin-only access, canonical hub behavior, live CSV export from the canonical hub, no dynamic detail surface | Unit, Integration, E2E | In Progress |
| Analytics dashboards | `/finance/reports/analytics`, `/finance/reports/cash-flow`, `/finance/reports/expenses`, `/finance/reports/income-statement`, `/finance/reports/overlap-audit` | `/api/finance/analytics`, `/api/finance/advanced-analytics`, `/api/finance/kpis`, `/api/finance/profit-margins`, `/api/finance/receivables`, `/api/finance/cash-flow-forecast`, `/api/finance/overlap-audit` | Shared aggregation consistency, admin-only access, overlap exclusion, date ranges | Unit, Integration, E2E | In Progress |

## Inventory

| Feature | UI Routes | API Routes | Critical Rules / Validations | Test Types | Status |
| --- | --- | --- | --- | --- | --- |
| Inventory overview | `/inventory` | `/api/inventory/overview`, `/api/inventory/stats`, `/api/inventory/snapshot`, `/api/inventory/activity/recent`, `/api/inventory/charts` | Totals, low stock thresholds | Unit, Integration, E2E | Not Started |
| Products CRUD | `/inventory/products`, `/inventory/products/add`, `/inventory/products/:id/edit` | `/api/products`, `/api/products/:id` | SKU uniqueness, price validation, archiving | Unit, Integration, E2E | Not Started |
| Product media | `/inventory/products/:id/images` | `/api/products/:id/images`, `/api/upload` | Image count, storage paths | Unit, Integration, E2E | Not Started |
| Product archive | `/inventory/products/archived` | `/api/products/archive`, `/api/products/archived`, `/api/products/:id/archive` | Archive rules, restore behavior | Unit, Integration, E2E | Not Started |
| Product insights | `/inventory/stock-history` | `/api/products/:id/stock-history`, `/api/products/:id/sales`, `/api/products/low-stock`, `/api/products/barcodes` | History ordering, barcode validation | Unit, Integration, E2E | Not Started |
| Categories CRUD | `/inventory/categories`, `/inventory/categories/add`, `/inventory/categories/:id`, `/inventory/categories/:id/edit` | `/api/categories`, `/api/categories/:id`, `/api/categories/simple` | Name uniqueness per parent, hierarchy rules | Unit, Integration, E2E | Not Started |
| Brands CRUD | `/inventory/brands`, `/inventory/brands/add`, `/inventory/brands/:id/edit` | `/api/brands`, `/api/brands/:id` | Name uniqueness, active flag | Unit, Integration, E2E | Not Started |
| Suppliers CRUD | `/inventory/suppliers`, `/inventory/suppliers/add`, `/inventory/suppliers/:id/edit` | `/api/suppliers`, `/api/suppliers/:id`, `/api/suppliers/simple` | Contact validation, permissions | Unit, Integration, E2E | Not Started |
| Stock additions | (none) | `/api/stock-additions`, `/api/stock-additions/:id`, `/api/stock-additions/export` | Quantity validation, audit logs | Unit, Integration | Not Started |
| Stock reconciliations | `/inventory/stock-reconciliations`, `/inventory/stock-reconciliations/add`, `/inventory/stock-reconciliations/:id`, `/inventory/stock-reconciliations/:id/edit` | `/api/stock-reconciliations`, `/api/stock-reconciliations/:id`, `/api/stock-reconciliations/:id/approve`, `/api/stock-reconciliations/:id/reject`, `/api/stock-reconciliations/:id/submit` | Status transitions, approvals | Unit, Integration, E2E | Not Started |
| Stock transactions | (none) | `/api/stock-transactions` | Filtering, pagination | Unit, Integration | Not Started |

## Reports & Dashboards

| Feature | UI Routes | API Routes | Critical Rules / Validations | Test Types | Status |
| --- | --- | --- | --- | --- | --- |
| Main dashboard | `/dashboard` | `/api/dashboard/analytics`, `/api/dashboard/top-products`, `/api/dashboard/recent-transactions`, `/api/dashboard/sales-trends` | Data aggregation, permissions | Unit, Integration, E2E | Not Started |
| Inventory reports | `/inventory/reports` | `/api/reports/inventory`, `/api/inventory/reports` | Report generation, filtering | Unit, Integration, E2E | Not Started |

## Integrations & Backups

| Feature | UI Routes | API Routes | Critical Rules / Validations | Test Types | Status |
| --- | --- | --- | --- | --- | --- |
| Google Drive backups | (none) | `/api/admin/google-drive/authorize`, `/api/admin/google-drive/callback`, `/api/admin/google-drive/status`, `/api/admin/google-drive/disconnect` | OAuth flow, token refresh | Unit, Integration | Not Started |
| Backup jobs | (none) | `/api/admin/backup/create`, `/api/admin/backup/test`, `/api/admin/backup/history`, `/api/admin/backup/download/:id`, `/api/cron/backup` | Job status, permissions | Unit, Integration | Not Started |
| File uploads | (none) | `/api/upload` | Content type checks, size limits | Unit, Integration | Not Started |

## System & Misc

| Feature | UI Routes | API Routes | Critical Rules / Validations | Test Types | Status |
| --- | --- | --- | --- | --- | --- |
| Public landing | `/` | (none) | Content renders, navigation | Unit, E2E | Not Started |
| Offline page | `/offline` | (none) | Graceful fallback | Unit, E2E | Not Started |
| Health & debug | (none) | `/api/health`, `/api/debug-token`, `/api/debug/session`, `/api/test-middleware`, `/api/test-data`, `/api/test-auth`, `/api/test-email` | Response shape, auth guards | Unit, Integration | Not Started |
