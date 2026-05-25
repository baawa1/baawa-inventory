# Finance Sales and Purchase Integration

This is a historical note for an earlier finance integration pass.

The current finance source of truth is:

- `docs/app-documentation/finance/README.md`
- `docs/app-documentation/finance/how-finance-should-work.md`
- `src/lib/finance/ledger.ts`

Current behavior:

- POS sales are normalized through the shared finance ledger.
- Debt sales recognize only collected cash as income until later payment collection.
- Stock purchases affect cash and inventory value, not immediate profit.
- Manual finance entries are limited to standalone non-overlapping income and expense items.
- Reports are generated from the shared ledger through `/finance/reports`.

Do not use this file for route shapes, report parameters, component names, or accounting rules. Older references to sales/purchase toggles, `FinanceReports.tsx`, and treating stock purchases as immediate expenses are obsolete.
