# AI Concierge (modules/agent)

Claude, plugged directly into the WhatsApp conversation. Messages that no
scripted flow claims (not intake, not an `ENQUIRE` deep link, not a pre-qual
consent reply, not an upsell keyword) go to an agentic loop that can look
things up before answering — a concierge that *knows* the listings, the
person's deals, and the transfer-bottleneck playbook.

## Design principle: the agent talks, code decides

Claude never mutates state. Its tools are read-only lookups plus one
escalation flag; consent capture, deal transitions and anything a registered
property practitioner must do stay in the existing deterministic flows. The
scripted routes always run first in the dispatcher, so a pre-qual YES/NO can
never be "interpreted" by the model.

| Tool | What it does |
|---|---|
| `search_listings` | Active listings by suburb/keywords (max 5, no seller PII) |
| `get_my_deals` | The sender's deals + transfer-journey stage, scoped to their phone |
| `benchmark_deposit` | Compares a deposit to verified oobarometer benchmarks (docs/BOTTLENECKS.md) |
| `escalate_to_concierge` | Flags the thread for human takeover (recorded on the draft) |

The system prompt (`knowledge.ts`) is composed of named section constants
(identity, audience, positioning, pricing tiers, journey, viewings, Cape Town
certificates, buyer costs, market data, tools, behaviour, open questions,
confidential, style) joined once at module load — still one byte-stable
cached string. It encodes the positioning guardrails from CLAUDE.md (never
anti-agent/anti-PPRA, neutral savings framing), the verified BOTTLENECKS
numbers with their attribution rules and refuted-claim bans, the public tier
facts (Free 0% / Flex 1% / add-ons), hard safety rules (no financial/legal
advice, never collect income/ID/bank details in chat, never promise
approval), a confidentiality section (internal economics are never in
context, so they cannot leak), and WhatsApp style constraints.

To change what the agent knows: edit the relevant `PROMPT_*` section in
`knowledge.ts` — `knowledge.test.ts` locks the load-bearing facts and
forbidden claims. Policy gaps the founders haven't answered yet live in
**docs/AGENT-QUESTIONS.md**; until answered, the prompt's open-questions
section makes the agent say "I'll get our concierge to confirm" and
escalate rather than improvise. Each answer folds into its section in a
small PR and comes off the open-questions list.

## No double questions (context-aware intake)

The listing intake is data-first: the next question is always the first
*missing* field, and every reply passes through an extraction layer, so
"4 bedroom home in Mowbray" fills title, suburb and bedrooms in one turn.
Three layers, degrading gracefully:

| Agent state | Who runs intake | How answers are understood |
|---|---|---|
| `AGENT_MODE=live` | Claude, conversationally (write tools `update_listing_draft` / `publish_listing`, validated + persisted by code) | The model itself |
| shadow / off, key set | Scripted flow (canned prompts) | `IntakeFieldExtractor` — one small structured-outputs call per turn, reads fields only, never writes text (`INTAKE_EXTRACTION=false` to disable) |
| No API key | Scripted flow | Deterministic parsing only (original behaviour) |

Both paths end at a **summary + explicit YES** before the listing goes
live (a wrong price no longer publishes silently; corrections like
"price 4500000" edit the draft at the confirm step). The agent and the
scripted flow share the same conversation store with a data-derived step,
so a failed agent turn falls back mid-conversation without losing fields.
The same principle covers enquiry: when live, the agent words the pre-qual
invite (aware of what the buyer said); POPIA consent remains a strict
deterministic YES/NO in code, always.

## Modes

| `AGENT_MODE` | Behaviour |
|---|---|
| `shadow` (default) | The agent only **drafts**. The user gets the standard help reply; the draft parks in `agent_drafts` for concierge review. |
| `live` | The reply sends immediately. Every turn still writes an audit row (`status: sent`). |

Review queue (internal-token guarded, same as the dashboard reads):

- `GET  /api/agent/drafts?status=pending` — the queue
- `POST /api/agent/drafts/:id/approve` — sends the draft (body `{"text": "..."}` to send an edited version)
- `POST /api/agent/drafts/:id/dismiss`

**The demo simulator runs LIVE by default** regardless of `AGENT_MODE` — it
is a playground on the reserved +2700 number range, so visitors talk to the
real concierge with no approval cards. Set `DEMO_AGENT_MODE=shadow` to
restore the draft-approval behaviour in the demo. Production (the real
WhatsApp number) is always governed by `AGENT_MODE`.

Rollout gate for production: run `scripts/agent-eval.mts` (real model, ~15
consumer questions incl. refuted-claim traps and internal-economics probes)
and read the transcript like a customer would; run shadow on real traffic →
review transcripts, tighten the prompt → flip `AGENT_MODE=live`. Escalated
threads are flagged on the draft either way.

## Configuration

```
AGENT_ENABLED=true            # off by default
AGENT_MODE=shadow             # shadow | live (production)
DEMO_AGENT_MODE=live          # demo simulator only; shadow restores cards
ANTHROPIC_API_KEY=sk-ant-...  # sandbox/test key in dev, per CLAUDE.md
AGENT_MODEL=claude-opus-4-8   # optional override
AGENT_EFFORT=low              # low | medium | high — low keeps latency snappy
```

The model adapter (`model.ts`) sits behind the `AgentModel` seam, same
pattern as the messaging BSP adapter — tests inject a scripted model and the
provider can be swapped without touching the dispatcher or service.

## Conversation memory

History comes from the existing `messages` table (last 40 turns for the
phone number), so the agent remembers the thread without any new state. The
system prompt is byte-stable and cached (prompt caching), keeping per-turn
cost and latency down.

## Playable WhatsApp demo (`/demo`)

`https://<api-host>/demo` serves a WhatsApp-look simulator wired to the
**production pipeline** — same dispatcher, scripted flows, agent, and
database. The marketing site proxies it too, so it's playable at
**www.solddirect.co.za/demo** (Next.js rewrites in
`apps/marketing/next.config.mjs`, using the `API_INTERNAL_URL` env var
already configured on Vercel). Only the transport is simulated: inbound goes through
`POST /api/demo/messages` instead of the BSP webhook, and outbound is
persisted to the message log instead of hitting Meta/Twilio.

- Paste the `INTERNAL_API_TOKEN` once (kept in the browser's localStorage);
  every demo API call is guarded by it.
- Each chat plays as a random number in the reserved `+2700xxxxxxx` range —
  an invalid SA prefix, so demo threads can never touch a real user, and the
  demo endpoints reject any other number.
- The demo agent is LIVE by default (`DEMO_AGENT_MODE`, see Modes). With
  `DEMO_AGENT_MODE=shadow` the agent's draft renders as an amber card with
  **Approve & send** / **Dismiss** buttons (approval sends through the demo
  transport only).
- "New chat" starts over as a fresh person.
- Disable the whole thing with `DEMO_ENABLED=false` when it has served its
  purpose. Demo traffic shares the production tables (listings created in the
  demo are real rows) — fine pre-launch, revisit before real users arrive.

## Verifying locally

`scripts/agent-smoke.mts` runs the whole loop against a real Postgres with a
scripted model (no live API call): webhook → dispatcher → agent tools →
shadow draft → approve → outbound send.

```
DATABASE_URL=... DIRECT_URL=... WHATSAPP_PHONE_NUMBER_ID=x npx tsx scripts/agent-smoke.mts
```

`scripts/agent-eval.mts` is the knowledge eval (REAL model + real Postgres):
~15 consumer questions with hard assertions on the non-negotiables and a
transcript for human review. Run it after any `knowledge.ts` change and
before flipping production to live:

```
DATABASE_URL=... DIRECT_URL=... ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/agent-eval.mts
```

## POPIA notes

- Tool outputs never include other parties' phone numbers or PII.
- `agent_drafts.toolCalls` stores tool **names** only, never tool output.
- If a user sends sensitive details (income, ID, bank), the prompt instructs
  the agent not to repeat them and to escalate; the draft queue gives a human
  the chance to catch anything before it sends while in shadow mode.
