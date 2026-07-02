# Sold Direct — WhatsApp Architecture, Journeys & Twilio Go-Live Playbook

> The WhatsApp loop is the core of the business. This document reviews **what is actually built
> today**, the **full integration list**, the **end-to-end journeys** (seller, buyer, external
> parties), and the **step-by-step strategy for taking it live on Twilio**.
>
> **Status legend:** ✅ built & tested · 🟡 built but not wired / stubbed · ⛔ not built yet.

---

## 1. TL;DR

- **Transport is real and tested**, but it currently targets **Meta's WhatsApp Cloud API directly**,
  **not Twilio**. Going with Twilio means adding one new adapter behind the existing interface — the
  seam was built for exactly this.
- **Every conversation flow is built and unit-tested** (listing intake, deal state machine, buyer
  enquiry, bond-referral consent), **but none are wired to the live webhook yet.** Today an inbound
  message is only *logged*; the system never dispatches it to a flow and never sends a reply.
- To go live on Twilio you need, in order: a **Twilio WhatsApp adapter**, a **dispatcher** that
  routes inbound messages to flows and sends replies, a **notifications module**, and **approved
  message templates**. Section 6 is the ordered checklist.

---

## 2. Current architecture (as built)

```mermaid
flowchart LR
  WA[WhatsApp user] -- inbound --> BSP[(Twilio / Meta BSP)]
  BSP -- "POST /api/webhooks/whatsapp" --> WH[Webhook route ✅]
  WH --> AD[MessagingAdapter ✅<br/>Meta Cloud API]
  AD --> RB[(messages table ✅<br/>idempotent)]
  WH -. "MISSING ⛔" .-> DISP[Dispatcher / router]
  DISP -. .-> INT[listings/intake ✅]
  DISP -. .-> ENQ[enquiry ✅]
  DISP -. .-> FIN[finance/ooba 🟡 stub]
  DISP -. .-> DEAL[deals state machine ✅]
  INT & ENQ & FIN & DEAL --> DB[(Postgres / Prisma ✅)]
  DISP -. "send() never called ⛔" .-> AD
  AD -- outbound --> BSP
  DB --> DASH[Internal dashboard ✅]
```

| Component | Path | Status | Notes |
|---|---|---|---|
| Messaging adapter interface | `apps/api/src/modules/messaging/types.ts` | ✅ | `MessagingAdapter`: `verifyChallenge`, `verifySignature`, `parseInbound`, `send`. `OutboundMessage` is **text-only**. |
| WhatsApp Cloud adapter | `.../messaging/whatsapp-cloud.ts` | ✅ | Meta Graph API. HMAC-**SHA256** over raw body vs `x-hub-signature-256`. Sends **text only** to `graph.facebook.com/{ver}/{phoneId}/messages`. |
| Webhook routes | `.../messaging/routes.ts` | ✅ | `GET /api/webhooks/whatsapp` (challenge) + `POST` (verify → parse → persist → `200`). |
| Message persistence | `.../messaging/repository.ts` | ✅ | Writes `messages`; idempotent on `waMessageId` (swallows Prisma `P2002`). `recordOutbound` exists but is **never called**. |
| Server wiring + raw body | `apps/api/src/app.ts` | ✅ | Registers webhook, leads, dashboard; raw-body JSON parser feeds signature check; `GET /health`. |
| Listing intake | `.../listings/intake.ts`, `service.ts`, `store.ts` | 🟡 | Scripted state machine `awaiting_title→suburb→price→bedrooms→bathrooms→exclusivity→completed`; trigger `^(list\|sell)`. Built + tested, **not wired**. |
| Deal state machine | `.../deals/state-machine.ts`, `service.ts` | 🟡 | Stages below; atomic `transitionDeal` writes append-only `DealEvent`. Built + tested, **no caller advances a deal**. |
| Buyer enquiry / profiles | `.../enquiry/service.ts`, `.../profiles/repository.ts` | 🟡 | Buyer → deal at `enquiry`; consent-gated pre-qual. Built + tested, **not wired**. |
| Finance / ooba referral | `.../finance/ooba-stub.ts`, `types.ts` | 🟡 | `FinanceReferralAdapter` seam + POPIA consent gate; **ObaReferralStub logs only**, returns synthetic id. |
| Dispatcher / router | — | ⛔ | **Nothing routes an inbound message to a flow.** The single biggest gap. |
| Notifications | `.../notifications/` | ⛔ | Empty (`.gitkeep`). No outbound is ever triggered. |
| Twilio adapter | — | ⛔ | Only the Meta adapter exists. Twilio is named in docs only. |

**Deal stages (SA transfer journey):**
`enquiry → offer_otp → bond_application → bond_granted → documents_fica → clearance → lodgement → registered` (plus `cancelled` from any non-terminal stage). Transitions are strictly forward one step; every change writes a timestamped, actor-stamped `deal_events` row. **Actor types today:** `seller | buyer | agent | system` — no external-party actor.

**Data models** (`apps/api/prisma/schema.prisma`): `Seller`, `Buyer`, `Listing`, `Deal`, `DealEvent` (append-only audit), `Message` (idempotency key `waMessageId`), `Lead` (marketing/investor capture), `ConversationState` (per-phone intake step). No models yet for conveyancer / bank / originator reference, or FICA documents.

**Deployed:** API on Railway — webhook target is
`POST https://sell-direct-production.up.railway.app/api/webhooks/whatsapp`.

---

## 3. Needed integrations

| # | Integration | Purpose | Status | Env keys / seam |
|---|---|---|---|---|
| 1 | **Twilio WhatsApp (BSP)** | Send/receive WhatsApp; template hosting | ⛔ new adapter | add `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID` (or `TWILIO_WHATSAPP_FROM`) |
| 2 | **Meta Business verification** | Own the WhatsApp Business number / display name | ⛔ (via Twilio) | done inside Twilio console |
| 3 | **ooba originator API** | Real bond pre-qual + application hand-off | 🟡 stub | `ORIGINATOR_REFERRAL_ENDPOINT`, `ORIGINATOR_API_KEY` (present, unused) |
| 4 | **Panel conveyancer(s)** | Transfer/bond/cancellation attorneys, FICA, clearance | ⛔ | new party model + adapter seam |
| 5 | **Banks / lenders** | Bond application status (via ooba multi-bank) | ⛔ | new party model + `DealEvent` actor |
| 6 | **Supabase Auth** | Dashboard login (replaces basic-auth) | 🟡 interface only | `SUPABASE_URL`, `SUPABASE_*_KEY`; `AuthProvider` seam |
| 7 | **Supabase Storage** | Listing photos, FICA docs | 🟡 interface only | `StorageProvider` seam |
| 8 | **Property24 / Private Property** | Listing syndication | ⛔ | new syndication adapter |
| 9 | **e-signature** | Sole mandate + OTP signing | ⛔ | new adapter (e.g. SignNow/DocuSign) |
| 10 | **FICA / KYC + affordability** | ID/credit checks | ⛔ | new adapter; `FIELD_ENCRYPTION_KEY` (present, unused) |
| 11 | **Property data / AVM / deeds** | Pricing, CMA, deeds search | ⛔ | new adapter (e.g. Lightstone) |
| 12 | **Payments** | 1% fee / add-on collection | ⛔ | new adapter (e.g. Peach/Stitch) |
| 13 | **Notifications module** | Actually send replies/updates via the adapter | ⛔ | `apps/api/src/modules/notifications/` |

Items 1–3 and 13 are the critical path to a working WhatsApp loop; 4–12 layer on for the full transfer journey.

---

## 4. End-to-end user journeys

Each step is tagged: **actor** · WhatsApp message class (**session** reply, free within the 24-h
window, vs **TEMPLATE**, required to *initiate* outside it) · deal-stage transition · integration
touched. The canonical UX script lives in `apps/marketing/components/journey.ts` (mirrored in
fundraising) — this section maps it to the backend.

### 4a. Seller journey — listing
| Step | Actor | Msg class | Stage / event | Integration |
|---|---|---|---|---|
| Taps "List my home" on solddirect.co.za (deep-link to WhatsApp) | Seller | — | — | website → wa.me link |
| Welcome + **POPIA consent** request | System | TEMPLATE (business-initiated) | — | Twilio template |
| "Yes, I agree" | Seller | session | consent logged | DB |
| Name + owner confirmation | both | session | — | `sellers` upsert |
| Choose **Free (0%, 90-day exclusive)** vs **Flex** | both | session | `listing.tier` | DB |
| Sole-mandate e-sign | both | session + link | — | ⛔ e-sign |
| Guided intake (title, suburb, price, beds, baths, exclusivity) + photos | both | session | creates `Listing` | ⛔ Storage for photos |
| "Listing live" + syndicated + shareable link | System | session | `status=active` | ⛔ Property24 / Private Property |

### 4b. Buyer journey — enquiry → offer
| Step | Actor | Msg class | Stage / event | Integration |
|---|---|---|---|---|
| Taps "Enquire on WhatsApp" (portal / link) | Buyer | — | — | wa.me link |
| Availability + **POPIA consent** | System | TEMPLATE | creates **Deal @ `enquiry`** | `buyers` upsert |
| Offer free ~2-min **bond pre-qual** → "Yes" | both | session | consent timestamp | POPIA gate |
| Collect income/deposit + credit consent → **prequal card** | System | session | `bondPrequalified=true` | 🟡 ooba (stub today) |
| Viewing booked | both | session | — | — |
| "I'd like to make an offer" → **OTP** built + e-signed; seller counters; accept | both | session + link | `enquiry → offer_otp` | ⛔ e-sign |

### 4c. External-party journey — bond, conveyancing, transfer
These steps need **new party models, an external-party actor type, and their own templates.**
| Step | Actor | Msg class | Stage / event | Integration |
|---|---|---|---|---|
| Multi-bank bond application → approved | ooba / bank | TEMPLATE (update) | `offer_otp → bond_application → bond_granted` | ⛔ ooba API, bank |
| Assign 3 attorneys (transfer/bond/cancellation) | conveyancer | TEMPLATE | — | ⛔ conveyancer |
| **FICA** both parties (ID, proof of residence, source of funds) | buyer/seller | session + upload | `bond_granted → documents_fica` | ⛔ FICA + Storage |
| Title deed, rates clearance, transfer duty | conveyancer | TEMPLATE | `documents_fica → clearance` | ⛔ deeds / municipal / SARS |
| Compliance certs (electrical, plumbing, gas, fence, beetle) | system | TEMPLATE | — | ⛔ |
| Clearance & guarantees → **lodged** at Deeds Office → **registered** | conveyancer / system | TEMPLATE | `clearance → lodgement → registered` | ⛔ Deeds Office |
| "0% commission" closing summary | System | session | terminal | — |

```mermaid
sequenceDiagram
  participant S as Seller
  participant SD as Sold Direct (API)
  participant B as Buyer
  participant O as ooba / Bank
  participant C as Conveyancer
  S->>SD: list (consent, intake, mandate)
  SD-->>S: listing live + syndicated
  B->>SD: enquire (consent)
  SD->>O: bond pre-qual referral
  O-->>SD: prequal result
  B->>SD: submit OTP
  SD-->>S: offer; S accepts
  SD->>O: bond application
  O-->>SD: bond granted
  SD->>C: instruct attorneys + FICA
  C-->>SD: clearance → lodgement → registered
  SD-->>S: registered — 0% commission
  SD-->>B: registered — keys
```

---

## 5. Twilio go-live playbook ("uploading into Twilio")

**Model:** our backend owns all conversation logic; **Twilio is the transport**. Nothing about the
state machine or the DB lives in Twilio.

### 5.1 Account & sender
1. In Twilio Console: **Messaging → Try WhatsApp** → use the **Sandbox** first (join code) for
   instant dev testing — no approval needed.
2. For production: **register a WhatsApp Sender** (a phone number you control), complete **Meta
   Business verification** (Twilio guides this), set the **display name** ("Sold Direct"), and attach
   the sender to a **Messaging Service** (holds sender, templates, fallback, status callbacks).

### 5.2 Message templates (the part that needs lead time)
Anything **you initiate outside the 24-hour session window must be a pre-approved template.** Author
them in Twilio's **Content Template Builder** and submit for WhatsApp approval (categories: *utility*
vs *marketing*). Concrete templates the journeys need:

| Template | Trigger | Category | Variables |
|---|---|---|---|
| `welcome_consent` | seller/buyer starts | utility | {{name}} |
| `prequal_invite` | after enquiry | utility | {{listing}} |
| `prequal_result` | ooba responds | utility | {{amount}}, {{rate}} |
| `otp_status` | offer sent/countered | utility | {{price}} |
| `bond_approved` | bank approves | utility | {{bank}}, {{amount}} |
| `fica_checklist` | enter documents stage | utility | {{party}} |
| `compliance_certs` | clearance stage | utility | — |
| `transfer_status` | lodgement/registration | utility | {{stage}} |
| `reengagement` | window expired | marketing | {{name}} |

Free-form replies **within** 24h of the user's last message don't need a template.

### 5.3 Webhook wiring
- Point the **Messaging Service inbound webhook** and **status callback** at
  `https://sell-direct-production.up.railway.app/api/webhooks/whatsapp` (POST).
- Twilio does **not** use Meta's GET challenge handshake — the GET route stays harmless; inbound is
  all POST.
- Twilio POSTs **`application/x-www-form-urlencoded`** (`From`, `To`, `Body`, `MessageSid`,
  `NumMedia`, `ButtonText`…) — different from Meta's JSON. Hence the new adapter below.

### 5.4 Adapter work (next PR — specified here, not built this session)
Add `TwilioWhatsAppAdapter implements MessagingAdapter` in `apps/api/src/modules/messaging/`:
- **`verifySignature`** — validate `X-Twilio-Signature` (base64 HMAC-**SHA1** of the full URL +
  alphabetically-sorted POST params, keyed by `TWILIO_AUTH_TOKEN`; Twilio's SDK `RequestValidator`
  does this). Note: this needs the **form params + exact URL**, so the webhook must expose them (a
  small change from the current raw-JSON path).
- **`parseInbound`** — map the form payload → `InboundMessage` (`From`→`from` stripping `whatsapp:`,
  `Body`→`text`, `MessageSid`→`waMessageId`, media via `NumMedia`/`MediaUrl0`).
- **`send`** — POST to the Twilio Messages API with `MessagingServiceSid` (or `From=whatsapp:+…`);
  session text via `Body`; **templates via `ContentSid` + `ContentVariables`**.
- Add a tiny **BSP factory** in `app.ts` selecting Meta vs Twilio by env (`WHATSAPP_BSP=twilio`), so
  both adapters coexist and are swappable.
- Add env keys: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_MESSAGING_SERVICE_SID`,
  `TWILIO_WHATSAPP_FROM`.

### 5.5 Cost note
Twilio charges a **per-message fee on top of Meta's conversation fees** (~US$0.005/msg + Meta's
category-based conversation price). This is the "BSP/Twilio markup" flagged as an open assumption in
`docs/dataroom/00-assumptions.md` — worth confirming against current Twilio SA pricing for the model.

### 5.6 Test plan
1. Sandbox: join, send a message, confirm it lands in the `messages` table.
2. Signed inbound: replay a Twilio POST with a valid `X-Twilio-Signature` → 200; invalid → 401.
3. Outbound: send a session text and an approved template; confirm delivery receipt via status
   callback.
4. Flow: an inbound "list" drives the intake state machine and a reply is sent (needs §6b/§6a).
5. See the transition appear in the internal dashboard timeline.

---

## 6. Gap analysis — ordered path to a live loop

Each item maps to an existing seam, so it's incremental:

1. **Twilio adapter + BSP factory** (§5.4) — `MessagingAdapter` seam already exists. ⛔
2. **Dispatcher** — after `recordInbound`, route by phone/conversation to intake / enquiry / consent
   / deal-command, then call `adapter.send()` **and** `repository.recordOutbound()` (both already
   exist, just uncalled). Construct the flow services in `app.ts` (they aren't today). ⛔
3. **Notifications module** — a thin service the flows call to send templated/session messages. ⛔
4. **Approved templates** in Twilio (§5.2) — start now; approval takes time. ⛔
5. **Real ooba adapter** — replace `ObaReferralStub` using `ORIGINATOR_*` env. 🟡→✅
6. **External-party models + actor type** — conveyancer/bank/originator party records; extend
   `DealEvent.actorType`; their inbound/outbound templates. ⛔
7. **e-sign, syndication, FICA + Storage + field encryption** — the remaining transfer-journey
   integrations; wire `StorageProvider` + `FIELD_ENCRYPTION_KEY`. ⛔

**Minimum viable live loop = items 1 + 2 + 3 + 4** (transport on Twilio, a dispatcher that replies,
and the first few approved templates). Everything else deepens the journey.

---

*See also: `README.md` (architecture overview), `DEPLOYMENT.md §4` (webhook setup),
`docs/POPIA-data-map.md` (PII inventory), `SECURITY.md` (consent/audit rules).*
