# Sold Direct — 5-Year Financial Model

All figures in **ZAR**. Years are operating years from launch (Y1 = first full year of
Cape Town operations). Figures are illustrative and rest on the sourced assumptions in
`00-assumptions.md`; several inputs carry a "confirm against primary source" flag.

## 1. The engine: how a registered deal makes money

Sold Direct earns **nothing from the consumer**. Per **registered transaction** it earns:

```
Revenue/deal  =  (bonded% × 0.5% × bond size)        ← bond-origination referral
              +  (panel-attach% × ~R4,000)            ← conveyancing referral
              +  (~R1,200 blended)                     ← add-ons
```

Because bond referral scales with bond size, **revenue per deal is highest in prime Cape
Town and falls as the model broadens to the national average** — a deliberate "land at the
top, expand down" sequence that front-loads revenue quality.

| | Y1 | Y2 | Y3 | Y4 | Y5 |
|---|---|---|---|---|---|
| Mix / region | Upper CT | CT | CT + W.Cape | W.Cape + early national | National |
| Avg transacting price | R4.0m | R3.6m | R2.8m | R2.1m | R1.7m |
| Bonded share | 45% | 48% | 50% | 52% | 55% |
| **Revenue per registered deal** | **R12,700** | **R11,800** | **R10,900** | **R9,800** | **R9,000** |

## 2. Volume ramp (registered deals/year)

Anchored to addressable transfer pools: CT metro ~38k/yr, Western Cape ~55k/yr, SA ~250k/yr.
Even the aggressive Y5 (14,000 deals) is **<6% of the national pool** and **~2.8% of bonded
transactions** — penetration stays modest, which is the point.

| Scenario | Y1 | Y2 | Y3 | Y4 | Y5 | Y5 as % of SA transfers |
|---|---|---|---|---|---|---|
| Conservative | 60 | 250 | 700 | 1,700 | 3,600 | ~1.4% |
| **Base** | **120** | **520** | **1,500** | **3,800** | **8,500** | **~3.4%** |
| Aggressive | 200 | 950 | 2,800 | 6,800 | 14,000 | ~5.6% |

## 3. Base case — full P&L (R'm)

| Line | Y1 | Y2 | Y3 | Y4 | Y5 |
|---|---:|---:|---:|---:|---:|
| Registered deals | 120 | 520 | 1,500 | 3,800 | 8,500 |
| Revenue/deal (R) | 12,700 | 11,800 | 10,900 | 9,800 | 9,000 |
| **Revenue** | **1.52** | **6.14** | **16.35** | **37.24** | **76.50** |
| COGS (~12%) | (0.18) | (0.74) | (1.96) | (4.47) | (9.18) |
| **Gross profit** | **1.34** | **5.40** | **14.39** | **32.77** | **67.32** |
| Gross margin | 88% | 88% | 88% | 88% | 88% |
| Payroll (headcount) | 5.6 (8) | 10.8 (15) | 17.8 (24) | 27.0 (36) | 38.0 (52) |
| Marketing | 1.2 | 3.8 | 7.5 | 12.5 | 16.0 |
| Tech & tools | 0.6 | 1.0 | 1.8 | 2.6 | 3.6 |
| Legal / compliance / insurance | 0.8 | 1.2 | 1.8 | 2.4 | 3.0 |
| G&A / office / other | 0.6 | 1.2 | 2.1 | 3.0 | 4.0 |
| **Total operating expenses** | **8.8** | **18.0** | **31.0** | **47.5** | **64.6** |
| **EBITDA** | **(7.46)** | **(12.60)** | **(16.61)** | **(14.73)** | **2.72** |
| EBITDA margin | — | — | — | — | 4% |
| **Cumulative EBITDA** | (7.46) | (20.06) | (36.67) | **(51.40)** | (48.68) |

- The business is **asset-light** (no inventory, minimal capex), so **cashflow ≈ EBITDA**
  plus a small working-capital allowance. Referral income is received within the transfer
  cycle (~6–12 weeks after registration), so a ~R3–5m working-capital buffer is assumed.
- **EBITDA turns positive in Y5** (base). The **cumulative cash low-point is ≈ −R51.4m at the
  end of Y4** — this drives the capital requirement (see `02-capital-and-valuation.md`).

## 4. Scenario summary (R'm)

| | Conservative | Base | Aggressive |
|---|---:|---:|---:|
| Y5 revenue | 27.0 | **76.5** | 140.0 |
| Y5 EBITDA | (2.8) | **2.7** | 14.6 |
| First EBITDA-positive year | ~Y6 | **Y5** | Y5 |
| Cumulative cash low-point | ~(38) | **~(51)** | ~(56) |
| Implied total capital need (incl. buffer) | ~R42m | **~R56m** | ~R62m |

> **Conservative** assumes throttled growth *and* disciplined spend (management cuts cloth to
> cash); it reaches breakeven a year later but at a similar capital low-point. **Aggressive**
> spends more to grow faster and reaches a much larger Y5 revenue base — the upside case for
> the valuation.

## 5. Sensitivities (what moves the answer most)

| Lever | Base | Downside | Upside | Why it matters |
|---|---|---|---|---|
| Referral share of origination commission | 0.5% | 0.35% | 0.8% | Directly scales the largest revenue line |
| Bonded share of deals | ~50% | 40% | 60% | Half of deals carry **no** bond income |
| Avg transacting price (segment mix) | R1.7–4.0m | shift mass-market | hold prime-CT longer | Bond referral scales with bond size |
| CAC / marketing efficiency | as modelled | 2× | 0.5× (organic/WhatsApp) | Purplebricks' failure mode — watch closely |
| Conveyancing panel share % | R4k/deal | R2k | R8k | Unconfirmed — negotiate up |

## 6. Health checks vs. the disruption baseline

- A R3.9–6m Cape Town seller pays **R225k–R483k** in traditional commission (5–7% + VAT).
  Sold Direct's **total revenue per deal (~R9–13k)** is **a small fraction** of what it saves
  the consumer — the "0% to you, we earn from the ecosystem" claim holds and is defensible.
- Sold Direct needs **~8,500 of ~250,000 annual SA transfers (3.4%)** by Y5 to reach the base
  case — credible for a category-defining channel, conservative vs. portal incumbents.
