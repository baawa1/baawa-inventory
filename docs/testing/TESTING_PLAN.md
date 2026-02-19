# Testing Plan

## Baseline Suite (Must Stay Green)
- Goal: Keep a small, reliable test suite focused on critical flows.
- Scope:
  - `tests/critical/**/*.test.{ts,tsx}`
  - `src/lib/utils/__tests__/**/*.test.{ts,tsx}`
- Command:
  - `npm run test` or `npm run test:baseline`

## Smoke E2E
- Goal: Validate core navigation for an approved admin.
- Scope:
  - `tests/e2e/smoke/`
- Command:
  - `npm run test:baseline:e2e`

## Legacy Suites (Quarantined)
- Run only when explicitly requested:
  - `npm run test:full`
  - `npm run test:legacy`
  - `npm run test:e2e:full`

## Known Issues / Follow-up Queue
- Rehabilitate legacy Jest configs in `tests/*` directories.
- Audit broken E2E flows and update selectors.
- Reintroduce coverage thresholds after the baseline suite is stable for 2+ weeks.

## Re-enabling Strategy
- Each sprint:
  - Move 1–2 stabilized tests into `tests/critical/`.
  - Expand `jest.baseline.config.js` if a suite proves reliable.
  - Track failures and fixes in this document.
