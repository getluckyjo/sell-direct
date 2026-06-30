# Sell Direct

WhatsApp-first property marketplace for Cape Town. **0% commission** to buyers and sellers; revenue from the financial ecosystem (bond origination via partner, conveyancing/insurance upside). This repo is the **lean MVP**.

> Strategy & business context: see `Sell-Direct-Project-Plan.md`. Build context for Claude Code: see `CLAUDE.md`.

## What the MVP does

A seller lists a property over WhatsApp → buyers enquire and get captured (optionally bond pre-qualified) and referred to our originator partner → a **deal record** tracks the transaction through the South African transfer journey → an internal web dashboard shows listings, deals and status.

## Architecture (modular monolith)

```
sell-direct/
├── apps/
│   ├── api/                # Node.js + TypeScript backend (Express/Fastify)
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── messaging/   # WhatsApp BSP adapter (swappable)
│   │       │   ├── listings/    # property listings
│   │       │   ├── deals/       # deal state machine (the core)
│   │       │   ├── profiles/    # buyer & seller profiles
│   │       │   ├── finance/     # originator referral hand-off (ooba)
│   │       │   └── notifications/
│   │       ├── db/              # schema + migrations
│   │       └── server.ts
│   └── web/                # Next.js (App Router) + Tailwind dashboard
├── packages/
│   └── shared/             # shared TypeScript types
├── .env.example
├── .gitignore
├── CLAUDE.md
└── README.md
```

### Key design choices
- **Adapter pattern** for every external service (WhatsApp BSP, originator, conveyancer, storage) — swap providers without touching business logic.
- **Deal state machine** models the SA transfer stages explicitly: `enquiry → offer (OTP) → bond_application → bond_granted → documents_fica → clearance → lodgement → registered`. Every transition is timestamped and logged.
- **POPIA by design** — see `CLAUDE.md` security rules. Test/sandbox keys only in development.

## Tech stack

| Layer | Choice |
|---|---|
| Backend | Node.js + TypeScript (**Fastify**), pnpm workspaces |
| Database | PostgreSQL via **Prisma** (managed by **Supabase** in deploy) |
| Frontend | Next.js (App Router) + React + Tailwind |
| WhatsApp | WhatsApp Cloud API via BSP (Clickatell / 360dialog / Twilio) |
| Auth/storage | **Supabase** (Auth + Storage) behind an interface — see `docs/SUPABASE.md` |
| Hosting | Vercel (web), Railway/Render (api), Supabase (Postgres) |
| CI | GitHub Actions (lint/typecheck/test/build/migrate on PRs) |

## Getting started (local / cloud sandbox)

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill with TEST/SANDBOX values only
cp .env.example .env

# 3. Start Postgres (Docker)
docker run -d --name selldirect-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16

# 4. Run migrations
npm run db:migrate

# 5. Run backend and frontend
npm run dev
```

The WhatsApp webhook needs a **public HTTPS URL** for Meta to reach it. In development use a tunnel (e.g. ngrok) or deploy the API to a staging host and point the Meta webhook there.

## WhatsApp setup (high level)

1. Create a Meta Business account + WhatsApp Business Platform app (or onboard via a BSP).
2. Configure the webhook URL → `POST /api/webhooks/whatsapp` and verify token.
3. Store credentials as **environment variables** (never in the repo).
4. Build message flows behind the `messaging` adapter so the BSP can be swapped.

## Environment variables

See `.env.example` for the full list. Never commit `.env`. Use sandbox/test keys in development.

## Status

🚀 **MVP feature-complete on `claude/dev-planning-discussion-nik2of`.** Shipped: monorepo scaffold; database + deal state machine; build env (CI + SessionStart hook) + Supabase decision; WhatsApp adapter + webhook; listing intake; buyer enquiry + (stubbed, consented) ooba referral; internal dashboard. Plus a public **marketing** site (waitlist) and an investor **fundraising** site.

**Live:**
- Marketing site → https://sell-direct-marketing.vercel.app (Vercel, auto-deploys from `main`)
- API → https://sell-direct-production.up.railway.app (Railway + Postgres; `/health` green)
- The waitlist works end-to-end: marketing form → API `/api/leads` → Postgres `Lead` table.

Remaining: deploy the investor **fundraising** site + internal **dashboard** to Vercel (same `API_INTERNAL_URL` wiring); then WhatsApp/BSP go-live — see `docs/DEPLOYMENT.md`.
