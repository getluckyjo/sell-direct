# AI concierge — founder questionnaire

The agent's knowledge base (`apps/api/src/modules/agent/knowledge.ts`)
covers everything the repo's research answers. The topics below are
questions real sellers and buyers WILL ask that no document answered —
**Johannes answered round 1 on 2026-07-10**, and **re-confirmed every one of
those answers on 2026-08-06** before they were folded in. Answered items go
into the prompt; TBC items stay on the agent's honest "I'll get our concierge
to confirm" list.

These answers are what the concierge states to real customers as fact —
several are effectively pricing or coverage policy. Re-read them whenever
the commercial model moves, and re-date the confirmation above when you do.

**How to answer the remaining ones:** fill in / update the **Answer:**
line, send the file back or paste in chat. Each answer gets folded into the
named prompt section in a small PR, comes off the open-questions list, and
a test locks the fact in.

---

### Q1 — Business hours & response time ✅ folded
**Answer:** A live team watches every conversation and responds as soon as
possible. No fixed office hours are promised.
**Folded into:** PROMPT_BEHAVIOUR

### Q2 — Human contact details ✅ folded
**Answer:** Escalations go to the founding team; for serious issues the
agent may say founder Johannes will be in contact. No phone/email is given
out — all contact happens on WhatsApp.
**Folded into:** PROMPT_BEHAVIOUR

### Q3 — Rentals / letting ✅ folded
**Answer:** Sales focus for now; a rental arm is planned. The agent invites
the person to leave details and escalates so the lead is captured for
launch.
**Folded into:** PROMPT_AUDIENCE

### Q4 — Coverage area ✅ folded
**Answer:** Greater Cape Town, roughly a 150 km radius. Expanding soon, but
deliberately focused on service delivery first; out-of-area interest is
logged.
**Folded into:** PROMPT_AUDIENCE

### Q5 — How offers get signed today ✅ folded (interim)
**Answer:** The concierge team prepares and handles offer paperwork with
both parties; in-WhatsApp e-signing is in build with the tech partner. The
agent never promises a launch date (timing stays on the open list).
**Folded into:** PROMPT_JOURNEY

### Q6 — Viewings: logistics & safety ⏳ TBC
**Answer (2026-07-10):** "We need to build this out and create solutions to
all scenarios." → Product work: viewing playbook + the 5-point prep
checklist. Agent keeps escalating specifics.
**Will fold into:** PROMPT_VIEWINGS

### Q7 — Cancelling a mandate / leaving exclusivity early ✅ folded (soft)
**Answer:** Sellers can switch Free → Flex at any time. Full withdrawal:
the agent does NOT state a hard "requires our approval" rule — it says the
team will help review the options under the mandate, and escalates.
**Why soft:** a hard "you cannot withdraw" claim could clash with SA
consumer-protection law (cooling-off, unfair-terms) before an attorney has
reviewed the mandate wording. Revisit once the mandate contract is legal-
reviewed.
**Folded into:** PROMPT_PRICING

### Q8 — Buyer already has a bank / own broker ✅ folded
**Answer:** Always welcome — buyers keep full choice. The seller-side
implication is stated honestly: the 0% Free path runs through the partner
ecosystem, so a sale concluded outside it falls under Flex (1%).
**Folded into:** PROMPT_PRICING

### Q9 — Buyer total costs ⏳ TBC
**Answer (2026-07-10):** "Once we have actual attorney rates we can give
quotes." → Until panel rates exist the agent quotes only the transfer-duty
anchor and defers fee specifics to the attorney.
**Will fold into:** PROMPT_BUYER_COSTS

### Q10 — POPIA data rights ⏳ TBC
**Answer (2026-07-10):** "Build out retention/erasure policy with standard
procedure." → Separate compliance task: draft the retention/erasure policy
+ appoint the Information Officer (also flagged in docs/POPIA-data-map.md).
Agent keeps routing data-rights requests to the team.
**Will fold into:** PROMPT_BEHAVIOUR

### Q11 — Sectional title / flats ✅ folded (interim)
**Answer:** Accepted today. The agent mentions levies, body-corporate rules
and the levy-clearance certificate, and loops in the concierge for scheme
specifics. Follow-up product work: sectional-title intake fields (extra
costs & requirements questions).
**Folded into:** PROMPT_JOURNEY

### Q12 — Is Flex actually sellable today? ✅ folded
**Answer:** Yes — a simple agreement that 1% is payable if the home sells
via the platform. Concierge sets it up (intake still creates Free-tier
listings; Flex is a manual contract for now). Follow-up: Flex agreement
template (attorney).
**Folded into:** PROMPT_PRICING

### Q13 — Add-on pricing ⏳ TBC
**Answer (2026-07-10):** "Pricing still TBC but will get quotes." → Agent
keeps deferring add-on prices to the concierge.
**Will fold into:** PROMPT_PRICING

---

## Follow-up work these answers created (not agent-prompt work)

1. **Viewing playbook** (Q6): scheduling flow, no-show handling, safety
   guidance, the 5-point seller prep checklist.
2. **POPIA retention/erasure policy + Information Officer** (Q10).
3. **Sectional-title intake fields** (Q11): capture levies/body-corporate
   requirements at listing time.
4. **Flex agreement template** (Q12) and **panel attorney rates** (Q9) —
   both need the attorney partnership work (docs/ATTORNEY-LED-TIER.md).

_Remaining TBC: Q6, Q9, Q10, Q13 (+ e-sign launch timing from Q5). When
those close, PROMPT_OPEN_QUESTIONS empties — the launch definition of
"flawless"._
