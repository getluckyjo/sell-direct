# Security & Privacy

Sell Direct handles personal and (later) financial data of South African buyers
and sellers. Privacy-by-design is a hard requirement from commit #1. POPIA
compliance is mandatory.

## Hard rules

- **Never commit secrets.** All credentials come from environment variables.
  `.env` is gitignored; only `.env.example` (placeholders) is committed.
- **Sandbox/test keys only in development.** This repo and its CI never hold
  production secrets.
- **Minimise PII.** Store only what a step needs; document every personal field
  and its purpose in [`docs/POPIA-data-map.md`](docs/POPIA-data-map.md).
- **Consent first.** Capture explicit, timestamped consent before collecting or
  sharing personal/financial data.
- **Encrypt sensitive fields at rest** (ID numbers, bank details, payslips) using
  `FIELD_ENCRYPTION_KEY`. These fields are introduced with the finance/FICA flow
  (PR 5); until then they are simply not collected.
- **Never log sensitive values.** No full ID numbers, bank details or payslip
  contents in logs. The Prisma client logs only `warn`/`error` outside dev.
- **Consented hand-offs only.** Every external data share (originator,
  conveyancer) goes through a documented, consented hand-off.

## Audit trail

The deal state machine writes an append-only `deal_events` row for every status
change (actor + timestamp). These rows are never updated or deleted, supporting
accountability and breach investigation.

## Reporting a vulnerability

This is a pre-launch MVP. Report security concerns privately to the maintainers
rather than opening a public issue.
