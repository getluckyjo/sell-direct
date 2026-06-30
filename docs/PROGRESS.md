# Sold Direct — Progress & Next Steps

_Internal status update. Refresh weekly._

## TL;DR

The MVP is **feature-complete in code** and on GitHub with automated tests passing
(CI green). The public **marketing** and **investor** sites are built. What's left
is **going live** — deployment and external sign-ups/partnerships — **not** more
building.

## What's built (the core loop works end-to-end)

- **WhatsApp-first journey:** list a property → buyer enquiry → **consented**
  in-chat bond pre-qualification referral → deal **tracked through the SA transfer
  stages** (enquiry → offer → bond → FICA → clearance → lodgement → registration).
- **Internal dashboard** ("control room"): listings, deals, and a live status
  timeline — access-gated.
- **Public marketing site** — "0% commission, keep your money" positioning +
  **waitlist capture**.
- **Investor site** — public teaser + **gated data-room request** (no confidential
  numbers or partners exposed).
- **Built to last:** typed end-to-end, CI on every change, **privacy-by-design**
  (POPIA data map, consent-gated finance), and **swappable adapters** so we can
  change WhatsApp provider or bond originator with no rework.

## Status

| Area | State |
| --- | --- |
| MVP code + tests + CI | ✅ Done, green |
| Marketing / investor sites | ✅ Built |
| Deployment (Vercel / Railway / Supabase) | 🟡 In progress — Vercel connected |
| Live WhatsApp + partner integrations | ⏳ Pending sign-ups |

## Next steps (priority order)

1. **Go live** — finish deploy: sites to Vercel, API + database to Railway/Supabase _(days)_.
2. **WhatsApp** — begin Meta/BSP onboarding now; it's the **longest lead time** _(1–3 weeks)_.
3. **ooba** — advance the referral partnership → unlocks real per-deal economics + live hand-off _(relationship-paced)_.
4. **Legal / POPIA** — appoint Information Officer; DPAs; counsel sign-off on the conditional-0% finance tie + practitioner status _(in parallel)_.
5. **Demand** — open the waitlist publicly to start collecting signal.

## Decisions / asks

- **WhatsApp provider:** Cloud API direct vs a BSP (Clickatell / 360dialog / Twilio)?
- **ooba:** commercial partnership now, strategic investment, or both tracks?
- **Owner + budget** for the legal sign-off.

## Top risks → mitigation

- Bond economics → lock via ooba.
- WhatsApp onboarding time → start today.
- Conveyancing kickback rules → software-fee model, not referrals.
- Conversion → instrument the funnel obsessively.
