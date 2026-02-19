# POS Payment Backfill Runbook

This runbook fixes historical sales marked as paid but showing outstanding balance
because no `transaction_payments` were recorded.

## Preconditions
- Database is backed up.
- You have access to the production `DATABASE_URL`.

## Dry Run (no writes)
```bash
DATABASE_URL="postgresql://..." node scripts/backfill-pos-payment-records.js
```

Review the count and sample IDs. If the count is unexpectedly large, stop and
investigate before applying.

## Apply Backfill
```bash
DATABASE_URL="postgresql://..." node scripts/backfill-pos-payment-records.js --apply
```

## Post-Check
1. Refresh the POS transaction history screen for a known paid sale.
2. Confirm `balanceDue` is now `0` and status is `PAID`.
3. If you use receivables dashboards, verify outstanding totals look correct.

## Notes
- This script only backfills **fully paid** sales with no recorded payments.
- It skips `split` and `debt` payment methods.
