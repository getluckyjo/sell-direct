# Sold Direct — Meta Business & Twilio WhatsApp onboarding runbook

> Everything needed to take **Sold Direct (Pty) Ltd** live on WhatsApp through Twilio, in the
> order that starts the slow, externally-gated things first. Console steps need a human login —
> this document is the script to follow, and records the decisions so they aren't re-derived.
>
> Companion docs: `docs/WHATSAPP-ARCHITECTURE.md` (what's built), `docs/whatsapp-templates.md`
> (template copy), `DEPLOYMENT.md §4` (webhook), `docs/POPIA-data-map.md` (PII inventory).

---

## 0. The question that had to be answered first

**"Can we put a second business on the existing Twilio account?"**

**Yes — but only as a Twilio *subaccount*, never alongside the existing sender.** This is a hard
structural rule, not a preference:

| Rule | Source |
|---|---|
| **One WABA per Twilio account/subaccount — strictly 1:1.** "You may only have one WABA in a Twilio account or subaccount, and each WABA should only be connected to a single Twilio account." | [Key concepts](https://www.twilio.com/docs/whatsapp/key-concepts) |
| Registering a second WABA in an account that already has WhatsApp senders fails with **error 63102 — "Account already linked to another WABA ID."** The fix Twilio names: *"create a different Twilio subaccount and connect the new WABA there."* | [63102](https://www.twilio.com/docs/api/errors/63102) |
| **"WhatsApp doesn't allow senders from different businesses to be registered in the same WABA."** So Sold Direct cannot simply be added as a second number under the existing WABA either. | [Tech Provider guide](https://www.twilio.com/docs/whatsapp/isv/tech-provider-program/integration-guide) |

**Decision: a dedicated Twilio subaccount, `Sold Direct (Pty) Ltd`, with its own new WABA.**

What that gives us, and what it costs:

- ✅ One Twilio login and **one consolidated bill** — subaccount usage bills to the parent account.
- ✅ Complete isolation: own Account SID + Auth Token, own numbers, own senders, own templates,
  own quality rating. A problem on the other business's WABA cannot touch Sold Direct's, and
  vice versa.
- ✅ Clean POPIA story — Sold Direct's message log and PII sit in a separate Twilio account, under
  the legal entity that is the responsible party.
- ⚠️ **Subaccount credentials are mandatory for anything on a `*.twilio.com` subdomain** —
  including `content.twilio.com`, where our templates live. Parent-account API keys are *denied*
  on subaccount resources. See §5.
- ⚠️ Subaccounts inherit the parent's messaging permissions, and **if the parent is suspended, the
  subaccount is suspended too**.

**Do not** try to reuse the existing business's WABA, Meta Business Portfolio or number. See the
trap table in §7 — the failure mode is silent, not loud.

---

## 1. Facts to fill the forms with

From `context/company.md` (CIPC filings of 3–4 August 2026). Every Meta and Twilio form below wants
these, and they must match the supporting documents **character for character**.

| Field | Value |
|---|---|
| Legal name | **SOLD DIRECT (PTY) LTD** |
| Registration number | **2026/615735/07** |
| Country of incorporation | South Africa |
| Registered address | 5th Floor, Mercantile Building, 63 Hout Street, Cape Town, Western Cape, 8001 |
| Website | *(the live marketing domain — must be reachable and carry the privacy notice)* |
| Business email | An address on the company domain — **not** a gmail/personal address |
| Proposed WhatsApp display name | **Sold Direct** |
| Category | Real estate / Property |

**Display name.** "Sold Direct" is the trading form of the registered name, so it satisfies Meta's
display-name policy (the name must relate to the business). Low rejection risk — but if it is ever
rejected, **read the rejection reason before changing anything**; it tells you what Meta will accept.

**Supporting documents for business verification** (have these scanned before starting):

1. **CIPC registration certificate** — CoR 14.3 / CoR 15.2 (the name-change document showing
   SOLD DIRECT (PTY) LTD) plus the CoR 15.1.
2. **Proof of address in the company's name** — bank statement or utility bill for the registered
   address, dated within the last 3 months.
3. A business phone number and email Meta can send a verification code to.

---

## 2. Phase 1 — Meta Business Portfolio (start today, it is the slowest thing)

Sold Direct (Pty) Ltd is a **separate legal entity** from any other business on the Twilio account,
and Meta's Business Verification is per-portfolio and evidence-based. So it needs **its own Meta
Business Portfolio** — do not attach it to another company's portfolio.

1. Create the portfolio at [business.facebook.com](https://business.facebook.com) →
   **Business settings → Business info**, using the §1 values exactly.
2. Add the company website and business email; add Johannes and Déan as admins (two admins, so a
   single lost login never blocks the account).
3. Start **Business verification** → upload the §1 documents.
4. **Do not press "Add phone number" in WhatsApp Manager.** See §7 — that button is Meta's Cloud
   API path, and a number registered that way cannot be used by Twilio at all.

**Why verification matters even for one number:** an unverified Meta portfolio is capped at
**2 phone numbers across all its WABAs**; a verified one gets up to 20 numbers and 20 WABAs. It also
gates higher messaging tiers and the display name.

Meta verification typically takes days, occasionally longer. Everything in §3–§6 proceeds in
parallel; nothing below waits on it except go-live.

---

## 3. Phase 2 — Twilio subaccount, number, sender

### 3.1 Create the subaccount

Console → **Account → Subaccounts → Create new subaccount**, friendly name `Sold Direct (Pty) Ltd`.
(Or `POST /2010-04-01/Accounts` with the parent's credentials.) Record its **Account SID** and
**Auth Token** — these, not the parent's, become `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` in the
API's environment.

### 3.2 Get the number *into the subaccount first*

⚠️ **Buy the number inside the subaccount.** A number that already has a WhatsApp sender attached
**cannot be transferred** between accounts without a Twilio support ticket. Getting this order wrong
turns a five-minute step into a support queue.

South African numbers carry regulatory requirements: create a **Regulatory Bundle**
(`IsoCountry=ZA`, `EndUserType=business`, matching number type) with the §1 company details and
documents, **in the subaccount**, and wait for approval — Twilio review is typically up to three
business days. Start this the same day as §2.

### 3.3 Register the sender — through Twilio, and let it create a new WABA

Console → **Messaging → Senders → WhatsApp senders → Create new sender**, *while logged into the
subaccount*.

In the Meta self-sign-up popup that opens:

1. **Business Portfolio:** select the Sold Direct portfolio from §2.
2. **WABA: choose "Create a new WhatsApp Business Account".**
   **Do not select an existing WABA**, even one that looks correct and verified. Twilio's own
   documentation: *"Don't select a WABA that's been created outside of Twilio."* Selecting an
   existing one produces a registration that **completes on Meta's side and never reaches Twilio,
   with no error logged anywhere** — the Meta checklist sits on "Connecting phone number to
   provider" forever and Twilio's sender list stays empty.
   This is the single most expensive mistake available in this process, and it is the one that
   *sounds* most sensible. Business verification attaches to the **portfolio**, not the WABA, so a
   fresh WABA inherits it — we lose nothing slow.
3. Select **Create a new WhatsApp Business profile**.
4. Keep both windows open, same browser, and don't share the popup URL.

### 3.4 The verification code

Meta sends a code to the number being registered. There is no handset on a virtual number, so
**the code appears on Twilio's page and you type it into Meta's popup** — that direction catches
people out.

If nothing arrives: **a South African virtual number reporting `sms: true` can still never receive
Meta's code** — A2P delivery is filtered somewhere in the carrier chain. Capability is not
deliverability. The documented fallback:

1. Phone Numbers → Active numbers → the number → **Voice Configuration**
2. *A call comes in* → **Webhook** → `https://twimlets.com/voicemail?Email=<address>`
3. In the signup popup, request a new code and choose **Phone call**

The recording and transcription land in the Twilio account
(`twilio api:core:transcriptions:list`). **Trust the recording over the transcription** —
speech-to-text garbles spoken digits, and a wrong digit burns a rate-limited attempt.

⚠️ **Don't switch from SMS to voice mid-session.** Twilio's page holds an SMS listener for the whole
session; switching completes Meta's half while Twilio never receives the signal it is waiting for,
leaving the registration verified at Meta and unrecorded at Twilio. Restart Twilio's flow instead —
the Meta-side verification carries over.

If neither call nor SMS arrives at all: that is rate limiting from repeated attempts. More attempts
make it worse. Wait 20–30 minutes.

### 3.5 Messaging Service

Once the sender exists:

1. Create a **Messaging Service** in the subaccount and add the sender to its pool.
2. Point its inbound webhook and status callback at
   `https://sell-direct-production.up.railway.app/api/webhooks/whatsapp`.
3. **Send via the Messaging Service SID, never the raw number** (`TWILIO_MESSAGING_SERVICE_SID`) —
   senders can then be swapped or added without a deploy.

---

## 4. Phase 3 — the backend (already built)

The Twilio adapter, BSP factory, dispatcher and notifier are built and unit-tested
(`docs/WHATSAPP-ARCHITECTURE.md §2`). Nothing here is blocked on Meta.

**Prove the whole loop against the Twilio WhatsApp sandbox while approval is outstanding.** The
sandbox needs no approvals and works immediately; it is the single biggest lever on how stuck this
project feels. Set `WHATSAPP_BSP=twilio` with the sandbox `TWILIO_WHATSAPP_FROM=+14155238886` in a
non-production environment and drive a real conversation through it.

Env keys to set on Railway when the sender is live — **all from the subaccount**:

```
WHATSAPP_BSP=twilio
TWILIO_ACCOUNT_SID=AC…          # the SUBACCOUNT's SID
TWILIO_AUTH_TOKEN=…             # the SUBACCOUNT's auth token
TWILIO_MESSAGING_SERVICE_SID=MG…
TWILIO_WEBHOOK_URL=https://sell-direct-production.up.railway.app/api/webhooks/whatsapp
```

`TWILIO_WEBHOOK_URL` must be the **exact** public URL Twilio calls, character for character.
Signature verification is computed against it; behind a proxy the incoming request URL won't match,
and forwarded host headers are attacker-controllable, so the value comes from this fixed variable.

---

## 5. Phase 4 — templates

Nine templates are drafted in `docs/whatsapp-templates.md` and submitted by
`scripts/twilio-templates.mjs`. They approve independently of the sender, usually within minutes,
occasionally up to 48 hours.

**Run the script with the subaccount's SID and auth token.** `content.twilio.com` is a Twilio
subdomain, and parent-account credentials and API keys are *denied* on subaccount resources — a
template created with the parent's keys would attach to the *other* business's WABA.

```bash
node scripts/twilio-templates.mjs --dry-run            # preview, no account needed
TWILIO_ACCOUNT_SID=<SUBACCOUNT AC…> TWILIO_AUTH_TOKEN=<subaccount token> \
  node scripts/twilio-templates.mjs
```

Paste the printed `TEMPLATE_<KEY>=HX…` lines into the Railway env.

**Categorise honestly.** A template that leads with an offer is MARKETING whatever we'd prefer.
Marketing conversations cost more; a rejection for miscategorisation costs account standing, which
is far more expensive. Structural rules worth checking before submitting: no variable at the start
or end of a message or adjacent to another variable, quick-reply labels ≤ ~20 characters and at most
3 buttons, no URL shorteners, under ~1,000 characters.

---

## 6. Phase 5 — opt-in, which is what actually blocks go-live

**Open gap.** `apps/marketing/components/WaitlistForm.tsx` captures one consent checkbox:

> *"I agree to be contacted about Sold Direct and accept that my details are processed per the
> POPIA privacy notice."*

That satisfies POPIA but **not Meta**. Meta requires the WhatsApp channel to be **named explicitly**
in the opt-in. Widening the existing wording is the wrong fix — it merges two consents that a person
must be able to give separately.

Required change before any business-initiated WhatsApp message is sent:

1. A **separate, unticked, optional** checkbox naming WhatsApp — e.g. *"Yes, Sold Direct may message
   me on WhatsApp about my listing or enquiry."* Never bundled with the submit action or made a
   condition of joining the waitlist; consent that is a condition of the primary action is not
   freely given and is worthless.
2. Store **proof, not assertion**: the exact wording shown and a form version, travelling with the
   record. This needs a `whatsappConsentAt` + `consentWording` + `consentFormVersion` on `Lead`
   (today there is only a single `consentAt`). Define the wording next to the code that renders it
   so the two cannot drift.
3. Promise only what is actually delivered — the gap between what a message promises and what a
   person receives is what generates complaints, and complaints become account restrictions.

This is a code change, tracked separately; it is the last thing standing between an approved sender
and a legitimate first outbound message.

---

## 7. Traps, in the order they bite

| Trap | What happens | Rule |
|---|---|---|
| Reusing an existing WABA in the signup popup | Registration completes at Meta, **never reaches Twilio**, no error anywhere. Sender list stays empty. | Always **create a new WABA** in Twilio's flow |
| Registering via WhatsApp Manager → "Add phone number" | Number becomes Meta Cloud API's; Twilio cannot send on it. Recovery means removing it from WhatsApp Manager before restarting. | Register **only** through Twilio Console |
| Second WABA on an account that already has senders | Error **63102** | Use a **subaccount** |
| Buying the number in the parent account | Once a WhatsApp sender is attached it can't be transferred without a support ticket | Buy the number **in the subaccount** |
| Templates submitted with parent credentials | They attach to the other business's WABA | Use **subaccount** SID + token |
| Two WABAs with identical names | Nothing on screen distinguishes them; the one with the restriction history is often the one in use | Act on **WABA IDs**, never names |
| Switching SMS → voice mid-verification | Half-committed registration, spinner never resolves | Restart Twilio's flow |
| Setting a Railway env var without redeploying | Nothing changes; everything downstream looks broken for no visible reason | Redeploy after env changes |

**When something is silently not working**, check in this order:

| Symptom | Look at |
|---|---|
| Webhook 403 | `TWILIO_WEBHOOK_URL` vs the URL in the Twilio console, character for character |
| Webhook 500 | Which env var is missing — use a config health endpoint, not logs |
| Webhook 401 / a login page | Platform deployment protection |
| Twilio reports a generic HTTP failure | Twilio's own debugger log, which names the response it received |
| Verification code never arrives | Whether the call or SMS reached the number **at all**, before blaming the number |
| Sender never appears | Whether Twilio ever **attempted** the request: `twilio api:monitor:v1:alerts:list --page-size 20 -o json`. No registration alert means nothing was ever sent — there is nothing broken to unpick. |

A **405 on the webhook path from a browser is a good sign**: the route exists and refuses GET. It
proves routing only — it runs before our handler, so it says nothing about configuration.

---

## 8. Checklist

**Blocked on other people — start immediately**

- [ ] Meta Business Portfolio created for Sold Direct (Pty) Ltd (§2)
- [ ] Meta business verification submitted with CIPC + proof of address (§2)
- [ ] Twilio subaccount `Sold Direct (Pty) Ltd` created, SID + token recorded (§3.1)
- [ ] ZA regulatory bundle submitted **in the subaccount** (§3.2)
- [ ] Number purchased **in the subaccount** (§3.2)
- [ ] Sender registered via Twilio, **new WABA**, display name "Sold Direct" (§3.3)
- [ ] Templates submitted with **subaccount** credentials (§5)

**Ours to do, in parallel**

- [ ] Full loop proven end-to-end against the Twilio sandbox (§4)
- [ ] Messaging Service created; webhook + status callback pointed at the API (§3.5)
- [ ] Config health endpoint reporting which env vars are present (§7)
- [ ] **WhatsApp-specific opt-in on the waitlist form + consent-proof fields on `Lead`** (§6)
- [ ] Railway env set from the subaccount, redeployed, `WHATSAPP_BSP=twilio` flipped (§4)
