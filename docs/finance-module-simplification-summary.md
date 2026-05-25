# Finance Module Simplification

This is a historical milestone note for an earlier finance form simplification pass.

The current finance source of truth is:

- `docs/app-documentation/finance/README.md`
- `docs/app-documentation/finance/how-finance-should-work.md`
- `src/lib/validations/finance.ts`
- `src/lib/constants/finance.ts`

Current behavior:

- Manual income sources are limited to `SERVICES`, `INVESTMENTS`, `ROYALTIES`, `COMMISSIONS`, and `OTHER`.
- Manual expense types are limited to `UTILITIES`, `RENT`, `SALARIES`, `MARKETING`, `OFFICE_SUPPLIES`, `TRAVEL`, `INSURANCE`, `MAINTENANCE`, and `OTHER`.
- Manual `SALES` income is blocked because POS sales are the operational source of truth.
- Manual `INVENTORY_PURCHASES` expense is blocked because stock additions are the operational source of truth.
- Payment methods for manual finance entries follow the Prisma `PaymentMethod` enum.

Do not use this file for current form field lists, category options, payment method options, report types, or production-readiness status. Older references to loans, rental income, supplies, taxes, check payments, and `FinanceReports.tsx` are obsolete.
