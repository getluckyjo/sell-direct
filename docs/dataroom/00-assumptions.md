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
(median ~R3.4m, average ~R2.1m). **Strategy decision:** Sold Direct deliberately **targets the
prime segment** (Atlantic Seaboard, City Bowl, Southern Suburbs, Constantia; then prime
JHB-north / Umhlanga), where **R6–7m transacting prices are normal**. The model therefore uses a
**~R6.5–7.0m average transacting price** — defensible *because the target market is prime, not
the metro average* — with **40% bonded share** (prime buyers skew cash). This makes the R6m
figure used on the marketing site consistent with the target customer.

## B. Bond financing (the revenue multiplier)

| Input | Value used | Source | Rel. |
|---|---|---|---|
| Share of purchases bonded (vs cash) | **~50%** | Lightstone 2024 | Medium |
| Bank approval rate | **~83% national, ~87% Western Cape** | oobarometer | Medium |
| Deposit / LTV | **~10% deposit (90% LTV)** | oobarometer (FTB ~9.9%) | Medium |
| Average bond size | **~0.9 × purchase price** of bonded deals | Derived | Medium |

## C. Revenue rates per deal

| Line | Rate used | Source | Rel. |
|---|---|---|---|
| Bond-origination commission banks pay originators | **1.0%–1.9% of loan** | ooba / realestateinsights | Medium |
| **Referral-partner share** (Sold Direct is a referrer, not a licensed originator) | **~0.5% of loan** | ooba / IOL ("~0.5% for introducing business") | Medium |
| → Bond referral per **bonded** deal | **0.5% × bond size** (e.g. R3.6m bond → R18,000; R1.4m bond → R7,000) | Derived | Medium |
| Conveyancing referral per deal (negotiated panel rebate) | **~R4,000** base (assumption — exact SA panel-share % not recovered) | Estimate | Low |
| Add-ons (photography / compliance coordination / insurance), blended per deal | **~R1,200** base | Estimate | Low |
| Conveyancing transfer-fee context (guideline tariff) | R2m → ~R25k incl VAT; R5m → ~R66k | LSSA 2025 | Medium |

> **Blended revenue per registered deal** therefore *declines* over the plan as the mix
> shifts from prime Cape Town (bigger bonds) to mass-market national: **~R12.7k (Y1) → ~R9.0k
> (Y5)** in the base case. This is the single most important driver and is **defensible because
> it scales with bond size, which we source.**

## D. Cost inputs

| Input | Value used | Source | Rel. |
|---|---|---|---|
| WhatsApp messaging | **Service/utility in 24h window = free; marketing templates = main paid line** (~$0.025–$0.14/msg). Net ≈ negligible per deal | Meta pricing Jul 2025 | Medium |
| Gross margin (referral model, light COGS) | **~88%** (COGS ~12%: messaging, add-on fulfilment, payments) | Assumption | Medium |
| Fully-loaded cost per FTE (blended) | **~R700k–780k/yr** (eng intermediate ~R48k/mo, senior ~R100k/mo, ops ~R25–35k/mo, +13th cheque/benefits/payroll ≈ ×1.3) | OfferZen 2025 | Medium |
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

All five search angles and the verification verdicts are preserved in the workflow
transcripts (`subagents/workflows/wf_18f95307-779/`).
