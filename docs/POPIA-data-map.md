# POPIA Data Map

A running inventory of **personal information** Sold Direct stores, why we store
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
| `leads`   | `whatsappConsentAt`  | No        | Proof of the SEPARATE WhatsApp opt-in Meta requires before we business-initiate a WhatsApp message. | Null = never message this lead on WhatsApp. |
| `leads`   | `consentWording` / `consentFormVersion` | No | Proof of exactly what the person agreed to, and which version of the form said it. | Resolved server-side from the version; never sent by the client. |
| `whatsapp_opt_outs` | `phone` | Yes | Honour a STOP request — the number is refused by every outbound send. | Minimal by design: a phone number and a timestamp, nothing else. |
| `conversation_states` | `phone` | Yes | Resume a guided WhatsApp flow (e.g. listing intake) for this number. | Cleared when the flow completes; not logged. |

## Rules applied in code (PR 2)

- **Phone numbers are the contact key** and are therefore stored in plaintext
  (we must match inbound WhatsApp messages by number). They are treated as PII:
  never logged in full, never shared except through a consented partner hand-off.
- **WhatsApp consent is its own field.** Meta requires the channel to be named
  explicitly in the opt-in, so `whatsappConsentAt` is separate from `consentAt`
  — a lead may accept contact and decline WhatsApp. The wording shown is stored
  with its version (`CONSENT_FORM_VERSION` in `@sell-direct/shared`): proof, not
  assertion. Published versions are never edited in place, since that would
  rewrite the proof attached to existing records.
- **Inbound-first by design.** All marketing asks people to send LIST or
  VALUATION to us, so the first message is theirs. That opens WhatsApp's
  24-hour session window, inside which replies are free text and need no
  template and no prior opt-in. `whatsappConsentAt` governs the other
  direction — messages we start.
- **STOP is real.** `STOP` / `UNSUBSCRIBE` / `OPT OUT` is matched before any
  flow can claim the message, acknowledged once, and recorded in
  `whatsapp_opt_outs`. The guard lives on the notifier
  (`withOptOutGuard`), so stage updates, re-engagement nudges and
  conversational replies are all covered in one place rather than in each
  flow. A later inbound from that number clears the opt-out — they messaged
  us, so contact is re-initiated. `CANCEL` is deliberately NOT an opt-out:
  intake uses it to drop a draft.
- **Consent before financial data:** `buyers.financialConsentAt` must be set
  before any bond/finance information is captured or shared (enforced in the
  finance flow, PR 5).
- **Append-only audit:** every deal status change is recorded in `deal_events`
  with actor and timestamp — supporting accountability and breach investigation.
- **Logging:** the Prisma client logs only `warn`/`error` (never queries) outside
  development; sensitive values are never logged regardless.

## Listing street address (`listings.address`)

- **What:** the property's street address, given optionally by the seller at
  listing time (the intake question is explicitly SKIP-able).
- **Purpose:** accurate price guidance (valuation partner lookup, e.g. LOOM)
  and portal syndication — both stated to the seller when asked.
- **PII level:** medium (identifies the seller's home). **Never shown to
  buyers** or any public surface; served only on the internal-token-guarded
  dashboard endpoint.
- **Sharing:** will be sent to the valuation partner (LOOM) for an estimate
  once that integration is live — a documented processor hand-off; we do not
  accept or store owner names/contact data from valuation responses (data
  minimisation).

## Still to do (later PRs)

- Appoint an **Information Officer** and register as required (Phase 0, business).
- **Data-processing agreements** with each processor before sharing any personal
  data — including **Supabase** (managed Postgres + Auth + Storage), plus each
  BSP / originator / conveyancer.
- **Encrypt sensitive fields at rest** (`FIELD_ENCRYPTION_KEY`) when ID numbers,
  payslips and bank details are introduced (PR 5).
- Consent capture UX + retention/erasure policy.

## Listing photos (`listing_photos`)

- **What:** property images sellers WhatsApp us, stored via the storage
  provider (public `listing-photos` bucket — they are public marketing content
  shown to buyers and, later, portals).
- **PII level:** low (images of a property, not a person; the seller chose to
  publish them).
- **Follow-up (tracked):** inbound photos may carry **EXIF GPS coordinates**
  of the location they were taken (typically the seller's home — already
  disclosed by the listing itself, but metadata should still be stripped).
  Stripping requires an image-processing dependency (e.g. `sharp`) — the
  approved-dependency decision is pending; see the `TODO(POPIA)` in
  `apps/api/src/modules/listings/photos.ts`.
