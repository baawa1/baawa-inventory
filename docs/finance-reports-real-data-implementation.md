# Finance Reports Real Data Implementation

This is a historical milestone note for the move away from mock finance report data.

The current reporting model is documented in:

- `docs/app-documentation/finance/README.md`
- `docs/app-documentation/finance/how-finance-should-work.md`
- `src/lib/finance/ledger.ts`
- `src/lib/finance/reporting.ts`

Current behavior:

- Finance reports use the shared ledger, not standalone manual aggregates.
- Active report snapshot types are `FINANCIAL_SUMMARY`, `INCOME_STATEMENT`, and `CASH_FLOW`.
- The reports hub is `/finance/reports`.
- Historical snapshots are stored in `FinancialReport`.
- Profit, cash movement, inventory value, and receivables are reported as separate concepts.

Do not use this file for current sample numbers, category lists, report query parameters, or component names. Older references to `FinanceReports`, mock-data removal details, and legacy category examples are obsolete.
