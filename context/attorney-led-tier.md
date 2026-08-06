# Attorney-led selling tier — research & business plan

> **ARCHIVED — researched and parked, never reviewed by counsel.**
> Preserved from the unmerged `claude/attorney-led-tier` branch (10 July 2026).
> Blocked on attorney sign-off of the fee structure and mandate paperwork
> before any build. See `context/archive.md`.

_Status: researched and parked (July 2026). Not yet approved for build.
Origin: founder conversation with an attorney + the Chris Fick & Associates
article on marketing and selling of properties._

## The legal basis (verified against primary sources)

The Property Practitioners Act 22 of 2019 (PPA) defines "property
practitioner" very broadly — anyone who, in the ordinary course of business
and for gain, sells, markets, advertises or canvasses property on behalf of
another. Section 1 then **expressly excludes**:

1. **Attorneys and candidate attorneys** — regulated by the Legal Practice
   Council (LPC) instead, with the public protected by the Legal
   Practitioners Fidelity Fund rather than the PPRA's fund;
2. **Natural persons selling their own property** — Sold Direct's current
   FSBO sellers;
3. Sheriffs, and persons not acting in the ordinary course of business.

An attorney can therefore market and sell a client's property for a fee with
**no PPRA registration and no Fidelity Fund Certificate**.

Limits that shape any structure we build:

- The exclusion is **personal** to admitted attorneys and candidate
  attorneys. Non-attorney employees of a law firm doing sales work must
  register with the PPRA. Sold Direct staff are never covered.
- Guidance (LPC, commentators) is that the selling should genuinely happen
  within and in the name of the legal practice. **Substance over form** — an
  attorney lending their name while the platform performs the estate-agency
  function is a sham a regulator would look through.
- Digital portals arguably fall within the PPA's ambit; pure advertising
  conduits can seek exemption (s 4). A marketplace whose listings are either
  FSBO (excluded) or attorney-mandated (excluded) has clean lines end to end.

### Precedent

Chris Fick & Associates co-founded the **Attorney Realtor Hub**
(attorneyrealtorhub.co.za) — a web platform, explicitly _not_ an estate
agency, whose attorney members use its tools to market and sell clients'
properties, typically at ~2.5% + VAT vs the 5–7% agency norm. Several years
live. This is the proven "platform + exempt professional" structure; Sold
Direct's edge over it is the WhatsApp-first funnel and AI concierge.

## Can the attorney be in-house? No.

Under the Legal Practice Act, an attorney may only render legal services
**to the public** when practising for their own account, in a partnership,
or through a law firm owned and directed exclusively by practising
attorneys. An attorney employed by Sold Direct (corporate counsel) may only
serve the employer — they cannot act for our sellers, hold a trust account
for deposits, or issue the fee agreements the model depends on. Sold Direct
also cannot own the law firm (non-attorney equity is prohibited).

Workable structures, in order of closeness to "in-house":

1. **Anchor firm / dedicated desk (recommended start)** — a partner firm
   commits a dedicated attorney (or team) to Sold Direct mandates, embedded
   in our workflow: they live in our dashboard, take hand-offs from the
   WhatsApp flow, follow our SLA. Operationally in-house; legally the firm's
   practice.
2. **Attorney-founded satellite firm** — attorneys incorporate a small firm
   working primarily on Sold Direct deal flow (ARH is itself a JV of
   attorneys). We cannot own it but can be its dominant channel and charge
   it platform fees.
3. **Panel model** — several independent firms, sellers matched by area.
   More resilience, less control.
4. **In-house counsel** for Sold Direct's own legal work (contracts, POPIA,
   compliance) — fine, but never for seller mandates.

Scaling hybrid: the anchor attorney supervises **candidate attorneys**
(also excluded under the PPA) doing legwork — viewings coordination, buyer
follow-ups — the human layer scales without hiring agents.

## The economics (why firms will do the selling "for free")

Per ~R2.5m Cape Town sale:

| Role | Work | Income |
|---|---|---|
| Traditional agent | ±30–60 hrs (mandate, pricing, listing, enquiries, viewings, negotiation, OTP, transfer babysitting) | R125–150k (5–6% commission) |
| Attorney on Sold Direct | ±6–12 hrs (pricing sanity-check 1–2 h; negotiation + OTP 3–6 h — attorney work anyway; admin 2–4 h) | Transfer fee ±R28–35k; bond registration if buyer bonds via their panel ±R30k; bond cancellation ±R6–8k → **R40–70k conveyancing income per deal** |

The platform already does the rest of the agent's list: WhatsApp intake
builds the listing, photos flow in, the AI concierge answers buyer
questions 24/7, prequal is automated, sellers host viewings (platform
schedules), the deal tracker runs the transfer admin.

**The pitch to firms:** we bring mandates with the funnel automated; the
firm provides sales support at no charge to the seller and takes the
transfer (nominated by the seller).

**The consumer story:** seller pays 0%, gets attorney-led selling with
trust-account + fidelity-fund protection, and the attorney is funded by
transfer fees the buyer pays in any sale anyway. No new money enters the
system — the ±R150k simply stops going to an agent.

Differentiator no agent can copy: a partner firm may negotiate/discount the
buyer's transfer fees slightly as a platform perk.

## Revenue & compliance ground rules (non-negotiable)

- **Flat platform fees only** — attorney seat subscription, per-listing or
  per-lead flat fees charged to the firm (or seller). **Never a percentage
  split of the attorney's fee**: LPC rules restrict fee-sharing with
  non-attorneys and prohibit paid referrals (anti-touting). This point
  decides the whole revenue design — get written sign-off from our attorney.
- **The seller's free choice on paper**: the seller signs the sales mandate
  and the conveyancer nomination. The platform recommends; it never forces
  the appointment.
- **The AI concierge assists, it does not represent.** It stays a tool the
  seller or attorney uses — never "acting on behalf of the seller for gain"
  (untested territory under the PPA).
- **Messaging** (consistent with CLAUDE.md): "attorney-led selling,
  fidelity-fund protected" — a better-regulated alternative. Never framed as
  avoiding the PPRA or anti-agent.
- Deposits sit in the firm's **trust account** — Sold Direct never touches
  money (unchanged hard rule).

## Product implications (when we build it)

Three listing tiers:

| Tier | Who sells | Sold Direct revenue |
|---|---|---|
| Free (today) | Seller (FSBO — excluded person) | Ecosystem referrals (ooba etc.) |
| Assisted (today's upsells) | Seller with paid boosts | Upsell fees |
| **Attorney-led (new)** | Partner attorney under mandate | Flat seat/listing/lead fees from the firm |

Build sketch (all fits existing seams):

- WhatsApp upgrade path: after intake (or on "HELP ME SELL"), offer the
  attorney-led tier → match to partner attorney → mandate + conveyancer
  nomination captured with explicit consent (deterministic code, like the
  POPIA consent gate).
- Attorney dashboard = existing web dashboard scoped to the firm's mandates
  (deal tracker, CERTS, photos, description already built).
- `ConveyancerAdapter` seam already anticipated by the adapter pattern;
  attorney matching is a new module, same shape as `finance/ooba`.
- Agent (AI) knowledge: tier explainer + hand-off rules; no representation.

## Year 2+ — "our own" conveyancing firm (captive-firm strategy)

_Founder idea (July 2026): from year 2, bring the conveyancing capability
in-house rather than handing R40–70k per deal to partner firms. Parked for
later; recorded here with the legal reality and the workable structures._

### The blunt legal reality

Sold Direct **cannot own a law firm**. The Legal Practice Act requires that
a firm rendering legal services to the public be owned and directed
**exclusively by practising attorneys** — no non-attorney shareholders, no
holding-company equity, no investor participation. Conveyancing
specifically must be performed by an admitted **conveyancer** (an attorney
who has passed the conveyancing exam), and only practising attorneys hold
the trust accounts transfers run through. Multidisciplinary ownership was
contemplated in the LPA (s 34) but the enabling regulations have never been
made — do not plan on that changing.

So "owning our own firm" really means: **capture the economics and
integration of a dedicated firm without owning its equity.** That is a
well-trodden structure (law, medicine and accounting all use variants of
it — a management/services organisation beside a professional practice).

### The captive-firm structure (how it actually works)

Two entities, kept genuinely separate:

1. **The firm** — e.g. "Sold Direct Conveyancing Inc." (name subject to LPC
   branding rules): incorporated and 100% owned by one or more practising
   conveyancers we recruit. It holds the trust account, the fidelity-fund
   cover, the PPA attorney exclusion, and every mandate. Its attorneys are
   its employees, not ours.
2. **Sold Direct (the platform)** — owns everything else the firm needs and
   charges **arm's-length, flat fees** for it:
   - technology: the deal tracker, WhatsApp pipeline, AI tooling, dashboard
     (licence/SaaS fee);
   - premises, equipment, back-office, non-legal staff (service fee);
   - brand licence and marketing (flat fee);
   - deal flow via the platform (no per-referral payment — the pipeline
     exists because sellers choose the tier, not because we are paid to
     steer them).

Sold Direct's return is the sum of those fees — priced at market rates and
reviewed annually — **never a percentage of the firm's legal fees**. The
firm's founding attorneys keep the (modest) residual profit of the practice;
that residual is their incentive and the structure's legitimacy.

Control without ownership comes from contracts: exclusive technology and
brand licence, service agreement, agreed SLAs, and the practical reality
that the platform is the firm's only funnel. What we can never contract
for: the attorneys' professional independence on any individual matter —
their duty is to the client and the LPC, and an agreement purporting to
override that is void and reportable.

### Why it's worth doing (year-2 economics)

- At, say, 20 attorney-led sales/month, partner firms would be earning
  ±R0.8–1.4m/month in conveyancing fees off our funnel. The captive
  structure converts most of that gross margin into platform fee income
  while keeping the seller at 0%.
- Deep integration: one firm running entirely on our stack means the deal
  tracker, CERTS, photos and AI concierge become the firm's actual practice
  management system — transfer times become a product metric we control.
- Buyer-side perk: the firm can price transfers keenly (fees are
  negotiable), which no traditional agent-plus-conveyancer pairing can
  match.
- Recruiting is realistic: newly-admitted conveyancers get a funded,
  full-pipeline practice from day one — scarce and attractive.

### Risks and how the structure must answer them

| Risk | Answer |
|---|---|
| **Fee-sharing / touting** (LPC rules) | All platform→firm charges flat and arm's-length; benchmarked, documented, reviewed by an ethics opinion before signing. No success fees, no per-file charges that scale with the firm's fee income. |
| **Sham / substance-over-form** | The firm must be a real practice: its attorneys make the professional decisions, sign the mandates, run the trust account. Sold Direct staff never perform legal or estate-agency acts. |
| **Key-person dependence** | The firm's owner-attorneys can walk (and take the firm — we don't own it). Mitigate: 2–3 founding conveyancers, staggered notice periods, the contracts + pipeline make leaving unattractive, succession clause obliging sale of shares to another practising attorney on exit. |
| **Seller's free choice** | The nomination stays the seller's, on paper and in the flow. The captive firm is the default recommendation, never the forced appointment; the panel option (other firms) remains available. |
| **Concentration risk for us** | Keep at least one independent partner firm live (panel) so the tier survives a captive-firm dispute. |
| **LPC branding/advertising rules** | Firm name, letterheads and our co-branding need LPC-rule review; "Sold Direct Conveyancing" may or may not be permissible — have fallback names. |

### Sequencing

- **Year 1** (per the plan above): anchor partner firm proves the tier,
  volumes, and unit economics. Everything we learn (SLAs, hand-off points,
  paperwork) becomes the captive firm's operating manual.
- **Year 2 trigger**: sustained volume that makes a dedicated firm viable
  (roughly ≥15–20 mandates/month) **and** an ethics/structuring opinion in
  hand.
- **Setup**: recruit 2–3 conveyancers → incorporate the firm → LPC
  registrations, trust account, fidelity-fund certificates → contracts
  (licence, services, brand) → migrate the default nomination to the
  captive firm; keep the panel.
- **Exit thought**: because the firm is contractually bound to the platform
  rather than owned, an acquirer of Sold Direct buys the contracts and the
  funnel — cleaner diligence than trying to sell equity in a law practice.

### Additional questions for the structuring attorney (beyond the year-1 list)

6. Exact LPC boundaries on the services/licence fee model (what may an MSO
   charge a firm; benchmarking evidence required).
7. Firm naming and co-branding rules; is "Sold Direct" in the firm name
   permissible?
8. Employment vs shareholding package for founding conveyancers (incl.
   share-transfer-on-exit clause to keep ownership with practising
   attorneys).
9. Whether the platform's default-recommendation of the captive firm needs
   specific disclosure wording to sellers (conflict-of-interest statement).

## Open questions for our attorney (before any build)

1. Confirm flat platform-fee structure vs LPC fee-sharing/touting rules —
   exact wording of what we may charge the firm.
2. Mandate + nomination paperwork: minimum contents, signing over WhatsApp
   (ECTA electronic signature position), records we must keep.
3. Any LPC advertising-rule constraints on how the firm's attorneys appear
   on our platform (branding "desk" inside Sold Direct).
4. Candidate-attorney supervision scope for viewings/buyer follow-ups.
5. Whether Sold Direct should seek a s 4 PPA exemption/comfort as an
   advertising conduit, or rely on FSBO + attorney-mandated listing status.

## Sources

- Property Practitioners Act 22 of 2019, s 1 definition ("property
  practitioner", exclusions) — saflii.org/za/legis/consol_act/ppa2019300/
- LPC, "Licensing & Registration under the PPA — what attorneys need to
  know" (July 2024) — lpc.org.za
- Chris Fick & Associates: "Marketing and selling of properties";
  "Attorneys selling properties: what's new?" — chrisfick.co.za
- Attorney Realtor Hub — attorneyrealtorhub.co.za
- Gawie le Roux Institute: "How attorneys can sell properties"
- Rebosa, "PPA and Regulations Q&A"
- LSSA Conveyancing Fee Guidelines (2025/26 tariff); STBB note on the
  April 2026 tariff increase

_This is business research, not legal advice — attorney sign-off required on
the fee structure and mandate paperwork before build._
