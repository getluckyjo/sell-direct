# Sold Direct — Transfer Bottleneck Playbook

> What breaks or stalls SA property deals, and the WhatsApp automation/instruction we deploy
> against each one. Built from a deep-research pass (5 search angles, ~15 sources fetched, every
> claim adversarially verified by 3 independent checkers — 2/3 refutations kill a claim).
>
> **Evidence status:** the verified numbers concentrate on **bond application** and **compliance
> certificates** (ooba's Q1 2026 oobarometer is the anchor dataset). The other stages carry
> **designed interventions with unverified frequencies** — marked ⚠︎ TO VALIDATE — plus two
> **refuted claims** we must never state in product copy (§4).

---

## 1. Verified findings → product actions

### 1.1 A bond decline is not the end — auto-resubmit saves ~half of them ✅ HIGH confidence
- **ooba's overall approval rate: 84% (Q1 2026)** — ~16% of applications fail even via SA's
  largest originator (incl. withdrawn/lapsed).
- **45.5% of applications declined by one bank were approved by another** (among deals ooba
  resubmitted). Initial single-bank decline rates are therefore far higher than the final 16%.
- Western Cape approval runs **86.2%** — slightly better than national.

**Product action (the single highest-value automation):**
> On a bank decline, the concierge **automatically triggers multi-bank resubmission** and messages
> both parties: *"Bank X declined — we're already resubmitting to the other banks. Nearly half of
> first declines are approved elsewhere, so this deal is still alive."*
> The deal **stays in `bond_application`** (no state change); the message rides the existing
> `transfer_status` template. Kills the #1 chain-collapse moment and the panic that goes with it.
> *Copy rule:* attribute the 45.5% to "deals resubmitted via our originator", not the whole market.

### 1.2 Deposit-shortfall triage in pre-qualification ✅ HIGH
- Average deposit: **12.8% of purchase price (R221,937)**, down from 15.4% a year earlier.
- **First-time buyers = 48% of applications**; **60.2% of them apply for 100% (zero-deposit)
  bonds**; their average deposit is 8.2% (R103,842).

**Product action:** the pre-qual flow asks deposit + first-time status and benchmarks against
these figures. Deposit well under benchmark → flag early, before an OTP is signed on hope.
First-time buyer → **surface the 100%-bond option by default** (frame as "many first-time buyers
qualify for zero-deposit loans — want us to check?", not a promise).

### 1.3 The multi-bank pricing story is quantifiable ✅ HIGH
- Rate concessions via ooba averaged **prime − 0.67%** (Q1 2026), a 12bp YoY improvement.

**Product action:** pre-qual invite copy can say *"buyers using our multi-bank application
achieved an average of prime − 0.67% last quarter"* — framed as the originator's **achieved
average, never a guarantee** (the improvement partly reflects general bank competition).

### 1.4 Cape Town's unique landmine: the Water Installation Certificate ✅ HIGH
- **Mandatory only in the City of Cape Town** (Water By-law s14(1)), issued by a City-accredited
  plumber; checks the meter, leaks, and stormwater-to-sewer. **A fresh certificate per transfer**
  (~6-month validity) — unlike an electrical CoC it cannot be reused.
- Out-of-town conveyancers and sellers routinely miss it → late-stage transfer delay.

**Product action:** the water cert appears in the **seller's checklist at listing time**, and the
moment the OTP is signed the concierge prompts: *"Book a City-accredited plumber now — this
certificate can't be reused from your last transfer."* (Our `compliance_certs` template already
covers plumbing generically; the CT-specific instruction rides session text / the checklist,
avoiding a template re-approval.)

### 1.5 Beetle certificate: contractual, coastal, and bank-demanded ✅ HIGH
- Not required by national law, but **customarily a condition of the OTP in the Western Cape and
  KZN** — and **banks financing the purchase increasingly require it even when the OTP is silent**.

**Product action:** our OTP flow **defaults to including the beetle-free clause** for Cape Town
deals, and warns bonded buyers at `bond_granted`: *"your bank may require a beetle certificate
regardless of the OTP wording"* — killing a classic late surprise.

### 1.6 Certificate costs the concierge can quote upfront 🟨 MEDIUM (2-1 vote — quote as "from")
- Electrical CoC **from R800–R1,200** (repairs from R1,000; large/multi-DB homes can run
  R2,500–R2,750+), gas **from R650–R950**, electric fence **from R600–R800**, water installation
  **from R500–R750**, beetle **from R400–R600**. **Repairs are separate: R1,000–R15,000.**

**Product action:** at listing intake the seller gets a **Cape Town certificate budget checklist**
with these as *"from R…"* estimates (one verifier showed market prices often exceed these bands —
never present as caps), plus the nudge to book inspections early rather than at clearance.

---

## 2. Full-journey playbook (designed interventions; ⚠︎ = frequency/cost still to validate)

| # | Stage | Bottleneck | Our automation / instruction | Status |
|---|---|---|---|---|
| 1 | Listing/mandate | Overpricing → stale listing ⚠︎ | Suggested price range from comparable-sales data at intake; day-30/60 price-review nudge | intake ✅, data feed ⛔ |
| 2 | Pre-qual | Affordability surprises | Deposit benchmarks + 100%-bond routing (§1.2) | flow 🟡 (consent gate ✅) |
| 3 | OTP | Suspensive-condition lapses, counter-stalls ⚠︎ | **Deadline countdowns** on every suspensive condition (e.g. "bond condition: 9 days left"); auto-nudge the silent party after 48h | templates ✅, countdown engine ⛔ |
| 4 | Bond | Single-bank declines | **Auto multi-bank resubmission + reassurance message** (§1.1) | notifier ✅, ooba API ⛔ |
| 5 | FICA | Expired/wrong documents ⚠︎ | Checklist per party (✅ `fica_checklist` template) + **validate before forwarding** (dated ≤3 months, ID legible) so the attorney never bounces a pack | template ✅, validation ⛔ |
| 6 | Compliance certs | CT water cert missed; beetle surprise; cost shock | §1.4–1.6 checklists, OTP clause default, early booking | template ✅, checklist copy ⛔ |
| 7 | Rates clearance | City turnaround, arrears disputes ⚠︎ | Attorney-request tracker + seller arrears check at listing ("any municipal arrears? settle early") | ⛔ + open question |
| 8 | Transfer duty | SARS processing ⚠︎ | Buyer cost disclosure at OTP (duty ≈ R458k on R6m) + payment-deadline countdown | ⛔ |
| 9 | Deeds Office | Rejection/re-lodgement, backlogs ⚠︎ | Lodgement status pings (✅ `transfer_status`); expectation-setting ("7–10 working days; rejections are common and fixable") | template ✅ |
| 10 | Human factors | Silent party, attorney comms gap ⚠︎ | **Escalation triggers:** no reply in 72h → human concierge takes over; every stage change mirrored to *both* parties automatically (✅ built) | stage-mirror ✅, escalation ⛔ |

**Already shipped** (this playbook plugs into it): stage-change notifications to both parties,
FICA/certs/transfer templates, the transition endpoint, dispatcher + notifier.
**Biggest new build:** the **deadline-countdown engine** (suspensive conditions, cert validity,
document expiry) — one scheduler serving stages 3, 5, 6 and 8.

---

## 3. Open questions (next research pass — targeted, cheap)

1. **Deeds Office**: actual lodgement rejection rates, common causes, current CT Deeds Office
   turnaround/backlog, linked-transaction effects.
2. **City of Cape Town rates clearance**: current turnaround; how often arrears disputes stall
   transfers.
3. **Electrical CoC validity** and the statutory-vs-contractual split of certificate/repair
   responsibility (see §4 — both refuted as commonly stated).
4. OTP suspensive-condition failure frequency; FICA rework rates (conveyancer interviews may beat
   web sources here — ask our panel conveyancer when signed).

## 4. ❌ Refuted — never state these in product copy

1. **"An electrical CoC is valid for two years"** — the widely repeated 2-year rule **failed
   verification 0-3**. Do not build an expiry auto-check on a 2-year window; treat validity as
   unresolved (get legal/conveyancer confirmation).
2. **"The seller is responsible by law for all certificates and repair costs"** — failed 1-2.
   The allocation is largely **customary/contractual**, not statutory. Seller-responsibility
   messaging must say *"customarily the seller's responsibility under the OTP"* pending legal
   review.

## 5. Source & bias notes

Anchor dataset: **ooba oobarometer Q1 2026** (latest as of July 2026; superseded quarterly) —
self-reported originator data describing *ooba's book*, not the whole market; five of six findings
rest on it. Corroboration: Property Wheel, City of Cape Town by-law + official Schedule 4 form,
STBB/Snymans/DVH conveyancer guidance, independent CT certificate providers. Certificate costs are
2024–2026 low-end estimates. Full verification transcripts preserved in the workflow run
(`wf_703f2c55-ac6`).
