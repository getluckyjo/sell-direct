# Claude Code — Kickoff Prompts for Sold Direct

How to use this file: do the one-time setup, then paste the prompts **in order**, one per session/PR. Review and merge each PR before moving to the next. Keep each chunk small.

---

## One-time setup (do this first)

1. Create a free **GitHub** account if you don't have one.
2. Create a **new empty repository** named `sell-direct` (no README, no .gitignore, no license).
3. Add the three files from this `claude-code-kickoff` folder to the repo so Claude has context:
   - `CLAUDE.md`, `README.md`, and (after Prompt 1 creates the structure) `.env.example` + `.gitignore`.
   - Easiest: upload them via GitHub's web "Add file → Upload files", or let Claude Code add them in Prompt 1 (paste their contents when asked).
4. Go to **claude.ai/code**, connect GitHub, and start a **new session** pointed at the `sell-direct` repo.
5. Make sure you're on a plan with Claude Code access (Pro or higher).

> Tip: before each prompt, you can ask Claude Code to "make a short plan and wait for my OK before coding." Good for staying in control.

---

## Prompt 1 — Scaffold the project

```
Read CLAUDE.md and README.md in this repo for full context before doing anything.

Scaffold the Sold Direct MVP as a TypeScript monorepo exactly matching the
structure in README.md:
- apps/api  (Node.js + TypeScript backend, Express or Fastify)
- apps/web  (Next.js App Router + Tailwind)
- packages/shared (shared types)

Set up: package manager workspaces, TypeScript strict mode, ESLint + Prettier,
a .gitignore, and a .env.example with placeholders for the keys we'll need
(database, WhatsApp BSP, originator referral). Do NOT put any real secrets anywhere.
Add npm scripts: dev, build, lint, db:migrate.
Add a health-check endpoint GET /health on the API.

Make a short plan first and wait for my approval. Then implement and open a PR.
```

## Prompt 2 — Database schema + deal state machine

```
Set up PostgreSQL with migrations (use Prisma OR Drizzle — pick one and explain why).

Create the core schema:
- listings (property details, price in ZAR, seller_id, status, exclusivity term, tier: free/flex)
- sellers and buyers (profiles; buyer optionally has bond_prequalified + approved_amount)
- deals (links listing + buyer; has a STATUS enum modelling the SA transfer journey:
  enquiry, offer_otp, bond_application, bond_granted, documents_fica, clearance,
  lodgement, registered, cancelled)
- deal_events (append-only log: every status change with timestamp + actor)
- messages (every inbound/outbound WhatsApp message)

Implement the deal as a STATE MACHINE: only valid transitions allowed, each
transition writes a deal_event. Write unit tests for valid/invalid transitions.

Follow the POPIA rules in CLAUDE.md: minimise PII, don't log sensitive values,
note each personal field's purpose. Plan first, then PR.
```

## Prompt 3 — WhatsApp messaging adapter + webhook

```
Build the messaging module with an ADAPTER interface so we can swap BSP later
(Clickatell / 360dialog / Twilio). Implement one concrete adapter for the
WhatsApp Cloud API.

- POST /api/webhooks/whatsapp  (receive inbound messages; verify Meta's verify token)
- GET  /api/webhooks/whatsapp  (Meta verification handshake)
- A send() function in the adapter for outbound messages
- Persist every inbound and outbound message to the messages table

Read all config from environment variables (see .env.example) — sandbox/test
values only. Add tests for the adapter and webhook parsing. Plan first, then PR.
```

## Prompt 4 — Listing intake flow

```
Build the listing intake module: a guided WhatsApp conversation that collects
property details step by step and creates a structured listing record (tier
defaults to 'free', captures exclusivity term). Keep the conversation logic
testable and separate from the WhatsApp adapter. Add tests. Plan first, then PR.
```

## Prompt 5 — Buyer enquiry + bond pre-qual referral hand-off

```
Build the buyer enquiry flow: a buyer enquires on a listing via WhatsApp, we
create/attach a buyer profile and a deal in 'enquiry' status. Optionally capture
bond pre-qualification intent and build a referral hand-off payload for our
originator partner (ooba) behind a finance ADAPTER interface (don't call any real
API yet — stub it and log the consented payload). Enforce explicit consent before
capturing financial data, per CLAUDE.md. Add tests. Plan first, then PR.
```

## Prompt 6 — Minimal web dashboard

```
Build a minimal internal dashboard in apps/web (Next.js + Tailwind, mobile-first):
- list of listings
- list of deals with current status
- a single deal view showing the status timeline from deal_events

Read from the API. Keep it simple and clean. Add a basic auth gate. Plan first, then PR.
```

## Prompt 7 — Deploy to staging

```
Help me deploy: apps/web to Vercel, apps/api + Postgres to Railway (or Render).
Walk me through it step by step as a non-developer, including setting environment
variables in each host's dashboard (NOT in the repo) and pointing the Meta
WhatsApp webhook at the deployed API URL. Produce a short DEPLOYMENT.md.
```

---

## Good habits between prompts
- **Review each PR on GitHub before merging.** Ask Claude to explain anything unclear.
- Turn on **automated Code Review** so each PR is checked for bugs/security before you merge.
- Keep PRs small; if a prompt produces too much, ask Claude to split it.
- After merging, start the next session fresh so context stays clean.
- Whenever you add a real API key, put it in the **host's environment settings**, never in the code.
