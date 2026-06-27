# POPIA Data Map

A running inventory of **personal information** Sell Direct stores, why we store
it, and how it is protected. POPIA requires purpose limitation and data
minimisation — every personal field must justify its existence here. Update this
file in the same PR whenever a personal field is added, removed, or repurposed.

> Scope as of **PR 2** (schema + deal state machine). Heavier PII (ID numbers,
> payslips, bank details) is **not yet collected** — it arrives with the
> FICA/finance flows (PR 5) and will be encrypted at rest then, with its own
> rows added below.

## Personal fields currently stored

| Entity    | Field                | Personal? | Purpose (lawful basis)                                                       | Protection                                                |
| --------- | -------------------- | --------- | --------------------------------------------------------------------------- | --------------------------------------------------------- |
| `sellers` | `phone`              | Yes       | WhatsApp contact key — the identifier we message and match inbound replies. | Unique; not logged in full; access via app only.          |
| `sellers` | `name`               | Yes       | Personalise the experience; show sellers as humans, not classifieds.        | Optional; not logged.                                     |
| `buyers`  | `phone`              | Yes       | WhatsApp contact key (as above).                                            | Unique; not logged in full.                               |
| `buyers`  | `name`               | Yes       | Personalisation; credibility to sellers.                                    | Optional; not logged.                                     |
| `buyers`  | `bondPrequalified`   | Yes       | Show "pre-qualified" trust signal; route to originator partner.             | Boolean only — no financial detail stored.                |
| `buyers`  | `approvedAmountZar`  | Yes       | The "approved up to RX" signal (UX + monetisation).                         | Amount only; no bank/account data.                        |
| `buyers`  | `financialConsentAt` | No\*      | Proof of explicit, timestamped consent before any financial-data handling.  | Timestamp only. \*Records a consent event, not PII as such. |
| `messages`| `fromPhone`/`toPhone`| Yes       | Route and audit WhatsApp messages; idempotent inbound handling.             | Not logged in full; `raw` payload sanitised of secrets.   |
| `messages`| `body`               | Maybe     | The message text exchanged with the user.                                   | Never store sensitive financial documents here.           |
| `leads`   | `email`              | Yes       | Contact a waitlist signup / investor enquiry from the public sites.         | Stored only with explicit consent (`consentAt`); not logged. |
| `leads`   | `name` / `phone`     | Yes       | Personalise follow-up with a lead.                                          | Optional; consent-gated; not logged.                      |
| `leads`   | `message`            | Maybe     | Free-text the lead chose to send.                                           | Consent-gated; not logged.                                |

## Rules applied in code (PR 2)

- **Phone numbers are the contact key** and are therefore stored in plaintext
  (we must match inbound WhatsApp messages by number). They are treated as PII:
  never logged in full, never shared except through a consented partner hand-off.
- **Consent before financial data:** `buyers.financialConsentAt` must be set
  before any bond/finance information is captured or shared (enforced in the
  finance flow, PR 5).
- **Append-only audit:** every deal status change is recorded in `deal_events`
  with actor and timestamp — supporting accountability and breach investigation.
- **Logging:** the Prisma client logs only `warn`/`error` (never queries) outside
  development; sensitive values are never logged regardless.

## Still to do (later PRs)

- Appoint an **Information Officer** and register as required (Phase 0, business).
- **Data-processing agreements** with each processor before sharing any personal
  data — including **Supabase** (managed Postgres + Auth + Storage), plus each
  BSP / originator / conveyancer.
- **Encrypt sensitive fields at rest** (`FIELD_ENCRYPTION_KEY`) when ID numbers,
  payslips and bank details are introduced (PR 5).
- Consent capture UX + retention/erasure policy.
