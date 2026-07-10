# WhatsApp copy deck — seller & buyer journey

This file is the single place to edit every message Sold Direct sends on
WhatsApp. Edit the text inside the ``` blocks, send the file back (or edit it
on GitHub), and the changes get applied to the code — nothing else needs to
change.

**Editing rules (keep these or the flow breaks):**

- Keep the `{placeholders}` exactly as written — they're filled in per
  message (e.g. `{title}` becomes the seller's headline).
- Keywords the system listens for: **list / sell** (start a listing),
  **YES** (confirm/consent), **SKIP** (skip description), **CERTS / COVER /
  MOVE** (upsells), **ENQUIRE** (buyer deep link). If you want different
  keywords, say so — that's a separate (easy) change; don't just reword the
  message to mention a keyword the system doesn't know.
- WhatsApp formatting works: *bold*, _italics_, emoji, line breaks.
- Keep it short — every message lands on a phone.
- These are the scripted texts. When the AI concierge is LIVE it words
  things naturally itself; these exact texts are still used in scripted and
  shadow mode, as fallbacks, and for everything deterministic (consent,
  photos, stage updates).

---

## A. Seller journey

### A1 — First contact / anything we don't understand
_When: message matches no flow (and the AI concierge is off or failed)._

```
Hi! Reply "list" to put your property on the market with 0% commission.
```

### A2 — Intake questions
_When: asked one at a time, only for details the seller hasn't already given
(a message like "4 bed home in Mowbray" fills several at once)._

A2.1 Headline:
```
Let's list your property — 0% commission. What's a short headline? (e.g. "2-bed apartment in Sea Point")
```

A2.2 Suburb:
```
Which suburb is it in?
```

A2.3 Price:
```
What's the asking price in Rand? (digits only, e.g. 2100000)
```

A2.4 Bedrooms:
```
How many bedrooms?
```

A2.5 Bathrooms:
```
How many bathrooms?
```

A2.6 Exclusivity term:
```
Exclusive listing term in days — reply 60, 90 or 120 (90 is recommended).
```

### A3 — Re-asks (answer didn't validate)
_When: the reply couldn't be understood for the current question._

A3.1 Headline:
```
Please give a short headline (at least 3 characters).
```

A3.2 Suburb:
```
Please tell me the suburb.
```

A3.3 Price:
```
Please send the price as digits in Rand, e.g. 2100000.
```

A3.4 Bedrooms:
```
How many bedrooms? Please reply with a number.
```

A3.5 Bathrooms:
```
How many bathrooms? Please reply with a number.
```

A3.6 Exclusivity term:
```
Please reply 60, 90 or 120.
```

### A4 — Acknowledgement prefix
_When: the seller's message filled extra fields; prepended to the next
question. `{fields}` is a list like `"4 bedroom home in Mowbray", Mowbray`._

```
Got it — {fields}.
```

_Variant when editing at the confirm step:_
```
Updated — {fields}.
```

### A5 — Summary + confirm
_When: all six details are in. The summary block + confirm question._

```
Here's your listing:
🏠 "{title}"
📍 {suburb}, Cape Town
💰 {price}
🛏 {bedrooms} bed · 🛁 {bathrooms} bath
📆 {term}-day exclusive term
```

```
Reply YES to go live, or tell me what to change (e.g. "price 4500000").
```

### A6 — Confirmed (listing pends until first photo)
_When: seller replies YES to the summary._

```
Perfect — your listing "{title}" in {suburb} at {price} is confirmed!

📝 Optional: reply with a short description buyers will read (a sentence or two about what makes it special), or reply SKIP.
📸 Then send 5–10 photos whenever you're ready — your listing goes live the moment your first photo arrives.
```

### A7 — Description saved
_When: seller typed a description (stored word-for-word)._

```
Description saved 👌 Now send 5–10 photos whenever you're ready — your listing goes live with the first one.
```

### A8 — Description skipped
_When: seller replies SKIP (or no / nope / later)._

```
No problem — you can add a description any time. 📸 Send your photos whenever you're ready and your listing goes live with the first one.
```

### A9 — First photo → listing goes LIVE (+ CERTS pitch)
_When: the first photo arrives on a pending listing._

```
📸 Photo saved — your listing "{title}" is now LIVE! 🎉 We'll start finding buyers. Keep the photos coming (5–10 is ideal).

💡 Plan ahead — every Cape Town sale needs compliance certificates before transfer: electrical (from ~R800), water installation (Cape Town-only, from ~R500, must be fresh for each transfer), gas (from ~R650), electric fence (from ~R600) and usually a beetle certificate (from ~R400). Repairs are extra. Reply CERTS and we'll book trusted inspectors early — sellers who sort these now avoid weeks of delay later.
```

### A10 — Further photos
_When: any photo after the listing is live. `{n}` = photo number._

```
📸 Photo {n} added to "{title}". Send more anytime.
```

### A11 — Photo sent mid-intake
_When: a photo arrives while the listing details aren't finished yet._

```
Great photo! Let's finish your listing details first — I'll ask for photos right after you confirm.
```

### A12 — Photo with no listing
_When: a photo arrives from someone with no listing and no draft._

```
Thanks for the photo! I don't see a listing for it yet — reply "list" to put your property on the market with 0% commission.
```

### A13 — Photo download failed
```
Hmm, that photo didn't come through — please send it again.
```

### A14 — Not an image
_When: a video/document/etc. arrives where a photo is expected._

```
I can only accept photos here (JPEG/PNG). Please send images of your property.
```

### A15 — Listing already completed
_When: the seller messages after finishing, with no other flow active._

```
Your listing is already in. Reply "list" to add another property.
```

---

## B. Buyer journey

### B1 — Enquiry deep link missing the listing
_When: someone sends "ENQUIRE" without a listing reference._

```
To enquire, tap "Enquire on WhatsApp" on the listing so we know which home you mean.
```

### B2 — Enquiry welcome + pre-qualification invite
_When: buyer taps "Enquire on WhatsApp" on a listing. (The prime −0.67% and
100%-bond claims are verified originator averages — keep that framing, never
a promise.)_

```
Thanks for your interest! Want a free, no-obligation home-loan pre-qualification right here? Buyers applying through our multi-bank partner achieved an average rate of prime −0.67% last quarter, and many first-time buyers qualify for 100% (zero-deposit) loans. Reply YES and we'll ask your consent before sharing anything.
```

### B3 — Pre-qualification consent given (YES)
_When: buyer consents. `{partner}` = ooba; `{reference}` = referral number._

```
You're being connected to {partner} for a free, no-obligation pre-qualification. Reference: {reference}.
```

### B4 — Pre-qualification declined (anything but YES)
_POPIA: nothing is stored or shared on a decline._

```
No problem — we won't share anything. You can pre-qualify any time by replying YES.
```

---

## C. Upsell keyword replies

### C1 — CERTS (compliance certificates)
```
👍 Great — we'll line up trusted, accredited inspectors for your compliance certificates and WhatsApp you the quotes shortly. Booking early is the single best way to avoid transfer delays.
```

### C2 — COVER (homeowners insurance)
```
👍 Great — our concierge will WhatsApp you competitive homeowners-insurance quotes shortly. No obligation; your bank just needs cover in place before registration.
```

### C3 — MOVE (movers / fibre / home services)
```
👍 Great — our concierge will WhatsApp you trusted quotes for movers, fibre and anything else you need for the big day. No obligation.
```

---

## D. Transfer-journey stage updates
_Sent when the deal moves stage. `{property}` = listing title. Where a
message says "detail", the operator can override it with a custom note.
The generic frame for most of these is:_

```
📌 Transfer update for {property}: {stage}. {detail}
```

### D1 — Offer to Purchase (buyer + seller)
```
📄 Update on {property}: an Offer to Purchase is being prepared for signature. Reply here to respond.
```

### D2 — Bond application submitted (buyer)
_Stage line + default detail:_
```
Bond application submitted
```
```
Your application is with the banks — we'll let you know the moment there's a decision.
```

### D3 — Bond granted (buyer, bank + amount known)
```
🏦 Your home loan for {property} has been approved by {bank} for {amount}. Next we'll start the transfer with the conveyancing attorneys.
```

### D4 — Bond granted (buyer, generic) / (seller)
_Buyer stage line + detail:_
```
Home loan approved
```
```
Next we start the transfer with the conveyancing attorneys.
```
_Seller stage line + detail:_
```
Buyer's home loan approved
```
```
The transfer now moves to the conveyancing attorneys.
```

### D5 — FICA documents (buyer and seller each get their own)
_`{party}` = "the buyer" / "the seller"._
```
To keep your transfer of {property} moving, please send {party}'s FICA documents: ID, proof of residence (≤3 months), and proof of source of funds. Reply with photos here — they're stored securely.
```

### D6 — Clearance stage (seller)
```
🔧 For {property} we now arrange the compliance certificates (electrical, plumbing, gas, electric fence, beetle). We'll book inspectors and keep you posted — no action needed yet.
```

### D7 — Clearance stage (buyer, includes COVER upsell)
_Stage line + detail:_
```
Clearance & guarantees in progress
```
```
Rates clearance and bank guarantees are being arranged. Your bank will need homeowners insurance in place before registration — reply COVER and we'll arrange competitive quotes, no obligation.
```

### D8 — Lodged at the Deeds Office (buyer + seller)
_Stage line + detail:_
```
Lodged at the Deeds Office
```
```
Registration usually follows in 7–10 working days.
```

### D9 — Registered 🎉 (buyer + seller, includes MOVE upsell)
_Stage line + detail:_
```
Registered 🎉
```
```
Ownership is now transferred — congratulations! Need movers, fibre or home insurance for the big day? Reply MOVE and we'll arrange trusted quotes.
```

### D10 — Cancelled (buyer + seller — sensitive, kept plain)
```
Update on {property}: the transaction has been cancelled. Reply here and we'll help with next steps.
```

---

_Source of truth in code: intake copy in
`apps/api/src/modules/listings/intake.ts`, photos in `listings/photos.ts`,
description in `listings/description.ts`, help + triggers in
`listings/service.ts`, buyer flow in `enquiry/service.ts`, upsells in
`conversation/dispatcher.ts`, stage updates in
`deals/stage-notifications.ts`. When copy changes here, those files (and
their tests) are updated to match. Approved-template variants for
out-of-session sends mirror `docs/whatsapp-templates.md`._
