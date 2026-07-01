# Sold Direct — Model Assumptions (sourced)

> **Status: model-grade, sourcing to confirm.** These assumptions were built from a
> deep-research sweep (5 search agents, ~22 source extractors, ~13 adversarial
> verifiers). The Cape Town price/volume anchors (Topics 1–2) were independently
> verified to **High** confidence. Many other figures were captured from search-engine
> snippets rather than fully-fetched primary PDFs (the research environment was
> egress-limited), so they are flagged **Medium** and should be re-confirmed against the
> primary documents (LSSA tariff, oobarometer, Lightstone newsletters, Meta SA pricing)
> before this goes to investors. The **structure** of every assumption is sound; several
> exact numbers carry a "confirm" flag.

Reliability key: **High** = verified / multi-source. **Medium** = single credible source
via snippet. **Low** = global proxy, weak SA fit, or dated.

---

## A. Market size & prices

| Input | Value used | Source / note | Rel. |
|---|---|---|---|
| SA annual residential transfers (addressable pool) | **~250,000/yr** (range 207k arms-length sales – 277k transfers) | Lightstone 2024; broader transfer series | High |
| Cape Town metro — annual sales value | **~R81bn (2024)** | Lightstone 2024 | Medium |
| Cape Town metro — implied transaction count | **~38,000/yr** (R81bn ÷ ~R2.1m avg) | Derived | Medium |
| Western Cape — annual transactions | **~55,000/yr** (estimate; discrete count not found) | Estimate | Low |
| **CT median price** | **~R3.4m** | Lightstone/Property24 | Medium |
| **CT average selling price** | **~R2.1m** | Property24 / Africanvestor | Medium |
| CT freehold-house average | **~R6.8m** (this is the "R6m" band — **prime, not average**) | Africanvestor 2026 | Medium |
| National average price | **~R1.4m** (Q1 2024) | Lightstone | High |
| First-time-buyer avg purchase | **R1,247,810** (Q1 2025) | oobarometer | Medium |

**Key correction:** ~R6m = **prime** Cape Town (freehold houses), **not** the average
(median ~R3.4m, average ~R2.1m). **Strategy decision:** Sold Direct deliberately **lands in the
prime segment** (Atlantic Seaboard, City Bowl, Southern Suburbs, Constantia; then prime
JHB-north / Umhlanga), where **R6–7m transacting prices are normal**. This makes the R6m figure
used on the marketing site consistent with the launch customer.

**Price taper (de-risks market share).** Rather than hold a flat prime price, the model **tapers the
average transacting price from R6.5m (Y1) to R4.0m (Y5)** — landing at prime and **broadening into
the upper-market (>~R4m)** as the brand scales. This lowers revenue/deal but expands the
addressable pool from ~14k prime (>R5m) to ~35k upper-market, cutting the implied Y5 share from
**~21% to ~8.3%** (see `03-market-sizing.md`). Bonded share is held at **~40–42%** (upper-market
skews cash). Price/bonded inputs are live on the Assumptions tab (C15:G15 / C16:G16).

## B. Bond financing (the revenue multiplier)

| Input | Value used | Source | Rel. |
|---|---|---|---|
| Share of purchases bonded (vs cash) | **~50%** | Lightstone 2024 | Medium |
| Bank approval rate | **~83% national, ~87% Western Cape** | oobarometer | Medium |
| Deposit / LTV | **~10% deposit (90% LTV)** | oobarometer (FTB ~9.9%) | Medium |
| Average bond size | **~0.9 × purchase price** of bonded deals | Derived | Medium |

## C. Revenue rates per deal

**Monetisation policy (legally clean — no bank exclusivity).** The free 0% tier requires a
**qualifying ≥80% bond + our panel conveyancer** — the buyer keeps **full rate-choice across
banks**. **In Year 1** the bond is placed via our multi-bank originator (**ooba**) and we earn the
**origination referral (~0.5% of bond)**. **From Year 2 we bring origination in-house, working
directly with the banks** under our own aggregation agreements, capturing the **full origination
commission (~1.5% of bond)** — roughly **3× the referral**. **Otherwise a 1% facilitation fee**
applies on the price (cash, sub-80%, or buyers who won't use our partners) — still **~6× cheaper**
than 5–7% agent commission. Separately, a bank pays a **headline-sponsorship fee** to be the
featured brand on the platform (advertising, not steering).

> ⚠️ **Why not a single-bank prerequisite:** making one bank a condition of the 0% is legally grey
> (consumer-steering, competition, PPRA). Replaced by the bank-agnostic referral/origination above +
> the sponsorship line below.
>
> ⚠️ **In-house origination is a regulatory step-up.** Operating as an originator direct with banks
> needs **bank aggregation agreements** and **FAIS/FSP accreditation** — a departure from the
> "refer to ooba, no own licence" starting stance. **Year 1 via ooba is the runway** to secure the
> agreements and accreditation before the Year-2 switch. Modelled with an explicit origination cost
> line + a one-off Y2 setup (see §D). Confirm the rate and terms against a real bank term sheet.

| Line | Rate used | Source | Rel. |
|---|---|---|---|
| Bank origination commission (banks pay originators) | **1.0%–1.9% of loan** | ooba / realestateinsights | Medium |
| **Origination referral share — Y1** (Sold Direct via ooba, multi-bank) | **~0.5% of bond** | ooba / IOL | Medium |
| **In-house origination — Y2+** (direct with banks, full commission) | **~1.5% of bond** (mid of 1.0–1.9%) | Assumption / bank norms | Low |
| **Facilitation fee** on non-partner deals | **1.0% of price** (Sold Direct policy) | Policy | n/a |
| → Origination-or-fee per deal, blended | Y1 `bonded%×0.5%×bond + (1−bonded%)×1%×price`; **Y2+ uses 1.5%** on the bonded portion | Derived | Medium |
| Conveyancing referral per deal (negotiated panel rebate) | **~R9,000–10,000** (prime; exact SA panel-share % not recovered) | Estimate | Low |
| Add-ons (premium photography / compliance / insurance), blended | **~R5,000–6,500** | Estimate | Low |
| **Bank headline sponsorship** (annual, platform-wide) | **R3.0m (Y1) → R8.0m (Y5)** — scales with audience/reach | Assumption | Low |

> **Revenue per registered deal ≈ R64.7k (Y1) → R79.6k (Y2) → R62.4k (Y5)** — steps up in Y2 as
> origination goes in-house, then eases with the price taper — plus the **annual sponsorship**.

**In-house origination cost inputs (from Y2 — new cost line).**

| Input | Value used | Note | Rel. |
|---|---|---|---|
| Cost per bonded deal (bond-consultant time / admin) | **~R6,000** | scales with bonded deals | Low |
| Bank-aggregation / origination licensing base (annual) | **R0.8m (Y2) → R1.5m (Y5)** | fixed compliance/relationship cost | Low |
| One-off setup / licensing (Y2 only) | **~R1.5m** | accreditation, systems, bank onboarding | Low |

> Net effect (base): Year-2 origination revenue uplift **outweighs** the added cost + setup — Y5
> revenue rises to **~R189m** and the cumulative cash low-point **improves** to ~−R3.3m.

**Reinvest-for-growth stance.** The base case **reinvests the high gross margin into above-the-line
(brand) marketing** — R2.5m (Y1) rising to **R50m (Y5)**, ~40% of revenue early easing to ~24% —
to drive the deal ramp (50 → 2,900 registered deals by Y5). This trades the lean model's ~68%
margin for a **~48% margin at ~2× the revenue**, and tests as a deliberate growth choice. The
ATL→deals conversion is an assumption to **validate with a pilot** before relying on it.

**Ancillary / ecosystem revenue (optional — the database value).** Owning the homeowner
relationship unlocks a referral menu worth **~R50,000 per customer** (homeowners & contents
insurance, solar, moving, fibre, security, life cover, estate planning, etc. — full table on the
workbook's Ancillary Revenue tab). Per-stream **attach rates are illustrative assumptions
(Low reliability)** to be validated. Modelled **optional (default off)**: ~R5,000 additional
captured per deal at ~10% blended capture; conveyancing & compliance certs are excluded here as
they already sit in the core model.

## D. Cost inputs

| Input | Value used | Source | Rel. |
|---|---|---|---|
| WhatsApp messaging | **Service/utility in 24h window = free; marketing templates = main paid line** (~$0.025–$0.14/msg). Net ≈ negligible per deal | Meta pricing Jul 2025 | Medium |
| Gross margin (referral model, light COGS) | **~88%** (COGS ~12%: messaging, add-on fulfilment, payments) | Assumption | Medium |
| Fully-loaded cost per **human** FTE (blended) | **~R700k–780k/yr** (eng intermediate ~R48k/mo, senior ~R100k/mo, ops ~R25–35k/mo, +13th cheque/benefits/payroll ≈ ×1.3) | OfferZen 2025 | Medium |
| **AI-agent run cost** (each, replaces a human worker) | **~R0.15m/yr** (~R12.5k/mo: LLM API + tooling + human oversight) | Assumption | Low |
| **AI-agent share of headcount** | **50%** (concierge/coordination/ops); ~halves people-cost | Assumption / design choice | Low |
| CAC | **Assumption with wide bands** — no SA property/mortgage CAC found; WhatsApp free-window + portal syndication + referral pulls effective CAC below paid-search proxies (~$84 B2B CPL global) | HubSpot 2025 (proxy) | Low |

## E. Valuation & funding context

| Input | Value used | Source | Rel. |
|---|---|---|---|
| Proptech revenue multiple (global avg 2025) | **~8.8× EV/revenue** — **discount to ~4–6× for SA early-stage** | Finro 2025 | Medium |
| African seed ticket (avg) | **~$1.6m** | Partech 2024 | Medium |
| African Series A | **$3m–$10m** | Partech 2024 | Medium |
| SA VC market (2024) | **R13.35bn, 1,325 deals** | CNBC Africa | Medium |
| Cautionary comp | **Purplebricks**: AIM IPO £240m → peak >£1bn → **sold for £1 (2023)** on CAC/over-expansion | Wikipedia | High |

## F. Confirmed gaps (to close before investor circulation)

1. Western Cape / Cape Town **transfer counts** (only CT rand-value recovered).
2. Conveyancing fee at **R3.5m & R6m**, and the **exact panel referral-share %**.
3. **SA-specific CAC** for property/mortgage leads.
4. **Exact SA WhatsApp ZAR rates** and BSP/Twilio markup %.
5. **ooba exact annual rand volume**; originator penetration figure is dated.
6. Ops/sales **salary** benchmarks; PropertyFox/ooba **valuation multiples**.
7. **In-house origination:** the **~1.5% commission we can capture direct**, the **bank
   aggregation terms**, and the **FAIS/FSP accreditation cost/timeline** — confirm against a real
   bank term sheet before relying on the Y2 switch.

All five search angles and the verification verdicts are preserved in the workflow
transcripts (`subagents/workflows/wf_18f95307-779/`).
