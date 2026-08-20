# Sold Direct — WhatsApp message templates (Twilio Content Template Builder)

Paste-ready templates for **Twilio → Messaging → Content Template Builder**, then **submit each for
WhatsApp approval**. Approval takes anywhere from minutes to ~24h, so create these early.

## How WhatsApp templates work here

- **Inside the 24-hour session window** (the user messaged us within the last 24h) we reply with
  **free text** — no template needed. Our dispatcher does this automatically.
- **Outside the window** (a status update days later — bond approved, lodged, registered) WhatsApp
  requires a **pre-approved template**. Those are the ones that matter most below.
- Twilio variables are numbered `{{1}}`, `{{2}}`… Our code passes them as
  `variables: { "1": "Maria", "2": "R6 000 000" }` and the template SID as `templateId`
  (Twilio `ContentSid`) via the notifier.
- **Category** must match the content or WhatsApp rejects it: **UTILITY** (transaction/account
  updates the user expects) vs **MARKETING** (promotional / re-engagement). Get category right —
  it's the #1 rejection reason. Keep language **en** (en_ZA if offered).

Once approved, copy each **Content SID (`HX…`)** into config and map it where the flow sends it.

---

## Uploading for approval

**Option A — one command (recommended).** `scripts/twilio-templates.mjs` creates all nine and
submits them for WhatsApp approval via the Content API. It's safe to re-run (existing ones are
reused, not duplicated) and needs only Node 18+.

```bash
# preview exactly what will be sent — no account needed:
node scripts/twilio-templates.mjs --dry-run

# then, with the SUBACCOUNT's Account Info keys (never commit these):
TWILIO_ACCOUNT_SID=AC... TWILIO_AUTH_TOKEN=... node scripts/twilio-templates.mjs
```

> **Use Sold Direct's Twilio subaccount credentials, not the parent account's.** Templates live on
> `content.twilio.com`, a Twilio subdomain where parent-account keys are denied on subaccount
> resources — parent keys would attach these templates to a different business's WABA.
> See `docs/META-ONBOARDING.md §5`.

It prints `TEMPLATE_<KEY>=HX…` lines — paste those into your API env (Railway / `.env`). Watch
approval status in **Console → Messaging → Content Template Builder**.

> You can run this now, before the sender number is approved — templates are account-level and
> approve independently of the sender.

**Option B — manual.** In **Content Template Builder → Create new**, pick the content type below
(text or quick-reply), paste the body, add the variables, then **Submit for WhatsApp approval** with
the stated category.

---

## The templates

### 1. `welcome_consent` — first contact + POPIA consent · MARKETING · quick-reply
> Hi {{1}} 👋 Welcome to *Sold Direct* — sell your home with **0% commission**. Before we start we
> need your consent to process your details under POPIA. Do you agree?

Buttons: **Yes, I agree** · **Tell me more**
Variables: `1` = first name (or "there"). *(Only needed if we message first; in-session we ask free-text.)*

### 2. `prequal_invite` — offer bond pre-qualification · UTILITY · quick-reply
> Great news — you're enquiring on *{{1}}*. Want a **free, no-obligation home-loan
> pre-qualification** right here on WhatsApp? We'll ask your consent before sharing anything.

Buttons: **Yes, pre-qualify me** · **Not now**
Variables: `1` = listing title / suburb.

### 3. `prequal_result` — pre-qual outcome · UTILITY · text
> ✅ You're pre-qualified up to *{{1}}* at approximately *{{2}}* over {{3}} years (indicative, via
> our partner BetterBond). Reply *VIEW* to book a viewing or ask me anything.

Variables: `1` = amount (e.g. "R6 200 000"), `2` = rate (e.g. "Prime −0.50%"), `3` = term ("20").

### 4. `otp_status` — offer sent / countered · UTILITY · text
> 📄 Update on *{{1}}*: {{2}}. Reply here to respond.

Variables: `1` = property, `2` = status sentence (e.g. "your offer of R5 900 000 was sent to the seller" / "the seller countered at R6 000 000").

### 5. `bond_approved` — bank approval · UTILITY · text
> 🏦 Your home loan for *{{1}}* has been **approved** by {{2}} for *{{3}}*. Next we'll start the
> transfer with the conveyancing attorneys.

Variables: `1` = property, `2` = bank, `3` = amount.

### 6. `fica_checklist` — FICA documents needed · UTILITY · text
> To keep your transfer of *{{1}}* moving, please send {{2}}'s FICA documents: ID, proof of
> residence (≤3 months), and proof of source of funds. Reply with photos here — they're stored
> securely.

Variables: `1` = property, `2` = party ("the buyer" / "the seller").

### 7. `compliance_certs` — compliance certificates · UTILITY · text
> 🔧 For *{{1}}* we now arrange the compliance certificates (electrical, plumbing, gas, electric
> fence, beetle). We'll book inspectors and keep you posted — no action needed yet.

Variables: `1` = property.

### 8. `transfer_status` — clearance / lodgement / registration · UTILITY · text
> 📌 Transfer update for *{{1}}*: **{{2}}**. {{3}}

Variables: `1` = property, `2` = stage ("Lodged at the Deeds Office" / "Registered 🎉"), `3` = one-line detail ("Registration usually follows in 7–10 working days." / "Ownership is now transferred — congratulations!").

### 9. `reengagement` — re-open an expired conversation · MARKETING · quick-reply
> Hi {{1}}, it's *Sold Direct*. We paused while your last chat window closed — want to pick up where
> we left off?

Buttons: **Continue** · **No thanks**
Variables: `1` = first name.

---

## After approval — wiring

1. Copy each Content SID (`HX…`) into a config map (env or a small constants file), e.g.
   `TEMPLATE_BOND_APPROVED=HX…`.
2. Where a flow needs to notify **outside** the session window, call the notifier with the template:
   `notifier.send(phone, fallbackText, { templateId: HX…, variables: { "1": property, "2": bank, "3": amount } })`.
   The Twilio adapter sends it as `ContentSid` + `ContentVariables`; the Meta adapter would use the
   template name (implement when/if we run Meta direct).
3. In-session replies (the dispatcher's immediate answers) stay free-text — no template required.

> **Tip:** keep template bodies stable after approval — editing text re-triggers review. Use the
> variables for anything that changes per deal.
