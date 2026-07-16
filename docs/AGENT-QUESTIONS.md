# AI concierge — founder questionnaire

The agent's knowledge base (`apps/api/src/modules/agent/knowledge.ts`) now
covers everything the repo's research answers. The 13 topics below are
questions real sellers and buyers WILL ask that **no document answers**.
Until a question is answered here, the agent is instructed to say honestly
"I'll get our concierge to confirm" and escalate — it never improvises
policy.

**How to answer:** fill in the **Answer:** line (a sentence or two is
enough), send the file back or paste answers in chat. Each answer gets
folded into the named prompt section in a small PR, the topic comes off the
agent's open-questions list, and a test locks the fact in.

---

### Q1 — Business hours & response time
**Why:** "Is someone there now?" / "When will I hear back?" is a top-3
support question. **Today the agent says:** it can't promise a response
time and escalates.
**Answer:**
**Folds into:** PROMPT_OPEN_QUESTIONS → PROMPT_BEHAVIOUR

### Q2 — Human contact details
**Why:** the agent can flag a thread for the concierge team, but there's no
phone number, support email or named person anywhere. What may it give out?
**Answer:**
**Folds into:** PROMPT_BEHAVIOUR

### Q3 — Rentals / letting
**Why:** "Can I rent out my flat through you?" — the whole product is sales
only, but no doc says whether rentals are refused, waitlisted, or planned.
**Answer:**
**Folds into:** PROMPT_AUDIENCE

### Q4 — Coverage area
**Why:** "Do you cover Durbanville / Somerset West / PE?" Positioning says
"Cape Town" — what's the actual boundary, and what does a seller outside it
get told?
**Answer:**
**Folds into:** PROMPT_AUDIENCE

### Q5 — How offers get signed today
**Why:** marketing says the OTP is "e-signed on WhatsApp" but the e-sign
integration isn't built yet. What actually happens when a buyer wants to
make an offer right now?
**Answer:**
**Folds into:** PROMPT_JOURNEY

### Q6 — Viewings: logistics & safety
**Why:** research says the seller hosts and buyers arrive pre-qualified,
but there's nothing on scheduling, no-shows, safety guidance, or what
happens if the seller can't be there. What's the 5-point prep checklist?
**Answer:**
**Folds into:** PROMPT_VIEWINGS

### Q7 — Cancelling a mandate / leaving exclusivity early
**Why:** "What if I change my mind during the 90 days?" No policy exists.
Can a Free-tier seller withdraw, switch to Flex, or list with an agency
mid-term — and does anything become payable?
**Answer:**
**Folds into:** PROMPT_PRICING

### Q8 — Buyer already has a bank / own broker
**Why:** compliance copy promises buyers full choice of bank, but there's
no answer for "I don't want your pre-qualification, I have my own bond
originator." Does anything change for them (or for the seller's 0%)?
**Answer:**
**Folds into:** PROMPT_PRICING

### Q9 — Buyer total costs
**Why:** buyers ask "what will this REALLY cost me?" We can anchor transfer
duty (~R458k on R6m). May the agent also quote typical bond-registration
and transfer-fee ranges, or should it always defer to the attorney?
**Answer:**
**Folds into:** PROMPT_BUYER_COSTS

### Q10 — POPIA data rights
**Why:** "Delete my data" / "how long do you keep my number?" The data map
lists retention/erasure policy and the Information Officer as still-to-do.
What should the agent say, and to whom does it route the request?
**Answer:**
**Folds into:** PROMPT_BEHAVIOUR

### Q11 — Sectional title / flats
**Why:** the journey is modelled on freehold. Flats bring levies, body
corporate consents and levy-clearance certificates. Do we accept sectional
title listings today, and is there anything different to tell those
sellers?
**Answer:**
**Folds into:** PROMPT_JOURNEY

### Q12 — Is Flex actually sellable today?
**Why:** the marketing site advertises Flex (1%, no exclusivity), but the
WhatsApp intake can only create Free-tier listings. When a seller says "I
don't want exclusivity", should the agent (a) take their details for a
concierge to set up manually, (b) say Flex is coming soon, or (c) something
else?
**Answer:**
**Folds into:** PROMPT_PRICING

### Q13 — Add-on pricing
**Why:** photography/floor plans, featured placement and cert coordination
are advertised "per service" with no prices. May the agent quote numbers,
or always hand to the concierge?
**Answer:**
**Folds into:** PROMPT_PRICING

---

_When all 13 are answered, PROMPT_OPEN_QUESTIONS should be nearly empty —
that's the definition of "flawless" for launch._
