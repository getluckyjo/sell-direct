# Sold Direct — MVP Development Roadmap

## Context

**Sold Direct** is a WhatsApp-first, **0%-commission** property marketplace for Cape Town, South Africa. Consumers pay nothing; revenue comes from the financial ecosystem around each deal (bond origination referrals to a partner — initially **ooba** — plus conveyancing/insurance upside). This repo is the **lean MVP** whose job is to prove one loop end to end:

> listing → buyer enquiry → in-WhatsApp bond pre-qualification → offer → tracked to property transfer.

The repo is currently **empty** (fresh git repo, no commits). This document is the agreed end-to-end roadmap. Per the kickoff guidance we build in **small, reviewable chunks — one feature per PR** — and **no code is written until this roadmap is approved**. Each subsequent PR will still get its own short plan + approval before implementation.

Source context: `CLAUDE.md`, `README.md`, `KICKOFFPROMPTS.md` (uploaded). The business-strategy doc `Sell-Direct-Project-Plan.md` was **not** provided; we proceed without it. If it contains changes to the deal stages or data model, that should be flagged before Chunk 2.

## Locked decisions (confirmed with user)

| Area | Choice |
|---|---|
| Backend framework | **Fastify** (TypeScript-first, built-in schema validation) |
| Package manager | **pnpm** workspaces |
| ORM / migrations | **Prisma** |
| Backend lang | Node.js + TypeScript (strict) |
| Frontend | Next.js (App Router) + React + Tailwind, mobile-first |
| Database | PostgreSQL |
| Managed backend | **Supabase** — managed Postgres + Auth + Storage, all behind interfaces (local/CI use a throwaway Postgres) |
| CI / dev env | **GitHub Actions** PR checks + a **SessionStart hook** to auto-provision web sessions |
| Locale | en-ZA, ZAR currency, DD/MM/YYYY dates |

**Progress:** PR 1–6 ✅ (scaffold · schema+state machine · build env+Supabase · WhatsApp webhook · listing intake · buyer enquiry+referral · dashboard) + public **marketing** & **fundraising** sites — all on `claude/dev-planning-discussion-nik2of` (PR #1). Remaining: PR 7 deploy (see `DEPLOYMENT.md`).

## Architecture principles (carried into every chunk)

- **Modular monolith.** Clear modules under `apps/api/src/modules/`: `messaging`, `listings`, `deals`, `profiles`, `finance`, `notifications`.
- **Adapter pattern for every external service** (WhatsApp BSP, bond originator, conveyancer, storage). No vendor SDK calls in business logic — always behind an interface so providers can be swapped (BSP: Clickatell / 360dialog / Twilio).
- **The deal state machine is the heart of the app.** Explicit SA-transfer stages; only valid transitions allowed; every transition writes an append-only, timestamped, actor-stamped `deal_events` row.
- **Typed end-to-end.** Shared types in `packages/shared`, reused by `apps/api` and `apps/web`. Prisma types feed the shared layer where practical.
- **POPIA by design** (see hard rules below) — from commit #1.

## Target repository structure

```
sell-direct/
├── apps/
│   ├── api/                      # Fastify + TS backend
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── messaging/    # WhatsApp BSP adapter (swappable) + webhook
│   │       │   ├── listings/     # property listings + intake flow
│   │       │   ├── deals/        # deal state machine (core)
│   │       │   ├── profiles/     # buyer & seller profiles
│   │       │   ├── finance/      # originator referral hand-off (ooba)
│   │       │   └── notifications/
│   │       ├── db/               # prisma schema + migrations + client
│   │       └── server.ts         # Fastify bootstrap, /health
│   └── web/                      # Next.js (App Router) + Tailwind dashboard
├── packages/
│   └── shared/                   # shared TS types (deal stages, DTOs)
├── pnpm-workspace.yaml
├── .env.example
├── .gitignore
├── CLAUDE.md
└── README.md
```

## POPIA / security — hard requirements (every chunk)

- **No secrets in the repo, ever.** Config via env vars; `.env` gitignored; only `.env.example` committed. **Sandbox/test keys only** in development.
- **Minimise PII** — store only what a step needs; document why each personal field exists.
- **Consent first** — capture explicit consent (with timestamp) before collecting/sharing personal or financial data.
- **Encrypt sensitive fields at rest**; never log full ID numbers, bank details, or payslip contents.
- Every external data share (originator, conveyancer) goes through a **documented, consented hand-off**.
- Maintain `SECURITY.md` + a running **POPIA data map** (personal field → purpose), updated whenever a personal field is added.

## The roadmap — one PR per chunk

Each chunk = its own short plan → approval → implementation → PR → review → merge → fresh session for the next.

### PR 1 — Scaffold the monorepo
- pnpm workspaces; `apps/api` (Fastify + TS strict), `apps/web` (Next.js App Router + Tailwind), `packages/shared`.
- Tooling: TypeScript strict, ESLint + Prettier, Conventional Commits, root scripts `dev`, `build`, `lint`, `db:migrate`.
- `.gitignore` (from the provided template — rename to `.gitignore`), `.env.example` with placeholders for DB, WhatsApp BSP, originator referral. **No real secrets.**
- `GET /health` on the API returning `{ status: "ok" }`.
- **Done when:** `pnpm install && pnpm dev` runs both apps; `/health` responds; lint passes; repo has the structure above.

### PR 2 — Database schema + deal state machine (the core)
- Prisma schema + first migration. Tables:
  - `listings` (property details, price ZAR, `seller_id`, status, exclusivity term, `tier`: free/flex)
  - `sellers`, `buyers` (profiles; buyer optionally `bond_prequalified` + `approved_amount`)
  - `deals` (links listing + buyer; `status` enum = SA transfer journey)
  - `deal_events` (append-only: status change + timestamp + actor)
  - `messages` (every inbound/outbound WhatsApp message)
- **Deal status enum:** `enquiry → offer_otp → bond_application → bond_granted → documents_fica → clearance → lodgement → registered` (+ `cancelled`).
- **State machine:** only valid transitions allowed; each transition writes a `deal_events` row. Unit tests for valid + invalid transitions.
- POPIA: mark/encrypt sensitive fields; note each personal field's purpose in the data map.
- **Done when:** migrations apply to a fresh Postgres; state-machine tests pass; data map updated.

### PR 2.5 — Build environment + Supabase backend (chore — separate from feature PRs)

**Why now:** CI is missing (PR checks currently only run on my machine), and each Claude-on-web session starts with no Postgres and no Prisma engines (manual setup was needed this session). Also lock **Supabase** as the managed backend so config + deploy reflect it. No business logic changes.

**A. Supabase as the managed backend (config + seams; concrete adapters deferred)**
- `apps/api/prisma/schema.prisma`: add `directUrl = env("DIRECT_URL")` to the datasource — migrations use Supabase's **direct** connection (5432); app runtime uses the **pooled** pgBouncer URL (6543, `?pgbouncer=true`).
- `.env.example`: split DB URLs + add Supabase keys: `DATABASE_URL` (pooled, runtime), `DIRECT_URL` (direct, migrations), `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (web). Keep plain-Postgres defaults for local dev; Supabase values are deploy-time, sandbox/test only.
- Define interface seams now (no `@supabase/supabase-js` dependency until used):
  - `apps/api/src/modules/auth/` — `AuthProvider` interface (`verifyAccessToken`, `getUser`); concrete `SupabaseAuthProvider` lands at **PR 6** (dashboard auth gate).
  - `apps/api/src/modules/storage/` — `StorageProvider` interface (`getUploadUrl`, `getObjectUrl`); concrete Supabase Storage adapter lands when uploads (listing photos / FICA) arrive.
- Docs: add `docs/SUPABASE.md` (create project → copy pooled + direct connection strings → set env in host, never in repo); update `README.md`, `docs/ROADMAP.md` to name Supabase; note in `docs/POPIA-data-map.md` that Auth/Storage are Supabase (DPA required).

**B. SessionStart hook (make web sessions build-ready)** — via the `session-start-hook` skill:
- Idempotent, fast on warm containers; on session start it: (1) ensures Postgres 16 is installed + running and the `sell_direct` dev DB exists; (2) makes Prisma usable under restricted egress — try normal `prisma generate`, and if the engine download is reset, fall back to curl-fetching the engine binaries (the host is allowed; only Prisma's Node downloader fails) and export `PRISMA_QUERY_ENGINE_LIBRARY`/`PRISMA_SCHEMA_ENGINE_BINARY`; (3) runs `pnpm install`, `prisma generate`, `prisma migrate deploy`; (4) sets session `DATABASE_URL`/`DIRECT_URL`.
- Registered as a SessionStart hook in `settings.json`. Keep `apps/api` `postinstall: prisma generate` but make the hook resilient to its failure.

**C. CI (GitHub Actions)** — `.github/workflows/ci.yml`, on PRs + pushes to `claude/**`:
- `services: postgres:16` (GH runners have open egress → standard Prisma works, no engine workaround).
- Steps: checkout → `pnpm/action-setup` → `setup-node@22` (pnpm cache) → `pnpm install --frozen-lockfile` → `prisma generate` → `prisma migrate deploy` → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`, with `DATABASE_URL`/`DIRECT_URL` → the service Postgres.
- Add `.nvmrc` pinning Node 22.

**Delivery:** stack on `claude/dev-planning-discussion-nik2of` (consistent with PR 1/2); CI runs on PR #1 once the workflow is on the branch.

**Verification:**
- CI goes green on the PR (lint/typecheck/test/build/migrate).
- Hook: from a clean state, running it yields Postgres up + `pnpm test`/`pnpm build` passing with zero manual steps.
- Supabase: `prisma validate` with `directUrl` set; `.env.example` documents pooled vs direct; no secrets committed.

### PR 3 — WhatsApp messaging adapter + webhook
- `messaging` module with an **adapter interface** (swap BSP later) + one concrete **WhatsApp Cloud API** adapter.
- `GET /api/webhooks/whatsapp` (Meta verification handshake) and `POST /api/webhooks/whatsapp` (inbound; verify Meta verify token).
- `send()` for outbound; **persist every inbound + outbound** message to `messages`.
- Config from env (sandbox values only). Tests for adapter + webhook parsing.
- **Done when:** webhook verification + inbound parsing tested; messages persisted; adapter swappable.

### PR 4 — Listing intake flow
- Guided WhatsApp conversation (WhatsApp Flows) collecting property details step by step → creates a structured `listings` record (`tier` defaults to `free`, captures exclusivity term).
- Conversation logic **separated from** the WhatsApp adapter and **testable** in isolation. Tests included.
- **Done when:** a scripted conversation produces a valid listing; logic unit-tested without a live BSP.

### PR 5 — Buyer enquiry + bond pre-qual referral hand-off
- Buyer enquires on a listing via WhatsApp → create/attach a `buyers` profile + a `deal` in `enquiry`.
- Optionally capture bond pre-qualification intent → build a **referral hand-off payload** behind a **finance adapter** (ooba). **Stub the API**, log only the consented payload.
- **Enforce explicit consent (timestamped) before any financial data is captured.** Tests included.
- **Done when:** enquiry creates buyer + deal; consented referral payload built + logged via the stubbed adapter; consent enforced and tested.

### PR 6 — Minimal internal web dashboard
- `apps/web` (Next.js + Tailwind, mobile-first), reading from the API:
  - list of listings
  - list of deals with current status
  - single deal view showing the status **timeline** from `deal_events`
- Basic auth gate (managed auth, e.g. Supabase, behind an interface).
- **Done when:** dashboard shows listings/deals/timeline from real API data behind an auth gate.

### PR 7 — Deploy to staging
- `apps/web` → Vercel; `apps/api` + Postgres → Railway (or Render). Env vars set in each **host dashboard**, never the repo.
- Point the Meta WhatsApp webhook at the deployed API URL. Produce `DEPLOYMENT.md` (non-developer, step-by-step).
- **Done when:** staging URLs live; webhook reaches the deployed API; deployment documented.

## Definition of done (whole MVP)

A seller can list a property over WhatsApp; a buyer can enquire and be captured as an (optionally pre-qualified) consented referral to the originator partner; a deal record tracks the transaction through the SA transfer stages; and an internal user sees all of it in the web dashboard — **without a single production secret in the repo.**

## Verification (per chunk and overall)

- **Local run:** `pnpm install`, `pnpm dev` (both apps), `pnpm lint`, `pnpm build`.
- **DB:** `pnpm db:migrate` against Dockerised Postgres (`postgres:16`); confirm migrations apply to a fresh DB.
- **Tests:** unit tests for the deal state machine (valid/invalid transitions), the WhatsApp adapter + webhook parsing, and all consent/money logic.
- **WhatsApp:** webhook needs a public HTTPS URL — use a tunnel (ngrok) locally, or the staging deployment, and exercise the Meta verification handshake + an inbound message round-trip.
- **POPIA check (each PR):** no secrets committed; `.env.example` current; sensitive fields not logged; POPIA data map + `SECURITY.md` updated for any new personal field.

## Open items / things to confirm before specific chunks

- **`Sell-Direct-Project-Plan.md`** — provided and reviewed; the deal stages and listing fields were validated against it (exclusivity corrected to days: 60/90/120, default 90).
- **BSP choice** for the first WhatsApp adapter (Cloud API direct vs Clickatell/360dialog/Twilio) — needed before PR 3; the adapter interface makes it swappable regardless.
- **Managed auth/storage** — decided: **Supabase** (Postgres + Auth + Storage), behind interfaces; concrete Auth adapter at PR 6, Storage when uploads land.
- **External accounts** (Meta WhatsApp Business, BSP, ooba referral, Vercel, Railway/Render) — needed before PR 3 and PR 7; these are your sign-ups and I'll guide you step by step.

## Note on progress

PR 1 (scaffold) and PR 2 (schema + state machine) are complete and on
`claude/dev-planning-discussion-nik2of` (PR #1). PR 2.5 (build environment +
Supabase backend) is in progress. Next feature chunk is **PR 3 (WhatsApp
messaging adapter + webhook)**.
