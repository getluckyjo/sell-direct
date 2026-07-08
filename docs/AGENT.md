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

The system prompt (`knowledge.ts`) encodes the positioning guardrails from
CLAUDE.md (never anti-agent/anti-PPRA, neutral savings framing), the verified
BOTTLENECKS numbers with their attribution rules, hard safety rules (no
financial/legal advice, never collect income/ID/bank details in chat, never
promise approval), and WhatsApp style constraints.

## Modes

| `AGENT_MODE` | Behaviour |
|---|---|
| `shadow` (default) | The agent only **drafts**. The user gets the standard help reply; the draft parks in `agent_drafts` for concierge review. |
| `live` | The reply sends immediately. Every turn still writes an audit row (`status: sent`). |

Review queue (internal-token guarded, same as the dashboard reads):

- `GET  /api/agent/drafts?status=pending` — the queue
- `POST /api/agent/drafts/:id/approve` — sends the draft (body `{"text": "..."}` to send an edited version)
- `POST /api/agent/drafts/:id/dismiss`

Rollout: run shadow on real traffic → review transcripts, tighten the prompt →
flip `AGENT_MODE=live`. Escalated threads are flagged on the draft either way.

## Configuration

```
AGENT_ENABLED=true            # off by default
AGENT_MODE=shadow             # shadow | live
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
database. Only the transport is simulated: inbound goes through
`POST /api/demo/messages` instead of the BSP webhook, and outbound is
persisted to the message log instead of hitting Meta/Twilio.

- Paste the `INTERNAL_API_TOKEN` once (kept in the browser's localStorage);
  every demo API call is guarded by it.
- Each chat plays as a random number in the reserved `+2700xxxxxxx` range —
  an invalid SA prefix, so demo threads can never touch a real user, and the
  demo endpoints reject any other number.
- Shadow mode is visible in the chat: the agent's draft renders as an amber
  card with **Approve & send** / **Dismiss** buttons (approval sends through
  the demo transport only).
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

## POPIA notes

- Tool outputs never include other parties' phone numbers or PII.
- `agent_drafts.toolCalls` stores tool **names** only, never tool output.
- If a user sends sensitive details (income, ID, bank), the prompt instructs
  the agent not to repeat them and to escalate; the draft queue gives a human
  the chance to catch anything before it sends while in shadow mode.
