# Finance Performance Optimization

This is a historical milestone note for an earlier finance page performance pass.

The current finance source of truth is:

- `docs/app-documentation/finance/README.md`
- `src/lib/finance/ledger.ts`
- `src/app/api/finance/summary/route.ts`
- `src/hooks/api/finance.ts`

Current performance-relevant behavior:

- Finance summary and reports use the shared ledger aggregation layer.
- Finance transaction lists are paginated at the API boundary after ledger normalization.
- Report and summary hooks use TanStack Query caching.
- Date filtering is normalized through the finance date-range helpers.

Do not use this file for current query counts, exact implementation snippets, or performance guarantees. Re-measure with the current ledger implementation before making production performance claims.
