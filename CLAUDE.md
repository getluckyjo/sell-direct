# CLAUDE.md — Sold Direct

> This file gives Claude Code the context to build the *right* thing. Read it fully before writing code. When in doubt, prefer the simplest thing that ships and ask before introducing new dependencies, services, or paid APIs.

## What we're building

**Sold Direct** is a **WhatsApp-first property marketplace for Cape Town, South Africa.** Sellers and buyers transact with **0% commission**; we make money from the financial ecosystem around the deal (bond origination via a partner, conveyancing/insurance as upside). This repo is the **lean MVP** — prove the loop: *listing → buyer enquiry → in-WhatsApp bond pre-qualification → offer → tracked to transfer.*

The full strategy lives in `../Sell-Direct-Project-Plan.md`. Key points that affect the code:

- **WhatsApp is the primary interface.** A web dashboard is the secondary "control room". Build mobile-first; assume most users only ever touch WhatsApp.
- **Revenue is conditional 0%:** free to the consumer *if* they list exclusively for a term and transact via our partners (bond originator + panel conveyancer). The product must capture which path a deal is on (qualifying vs Flex) and route finance to our originator partner (initially **ooba** by referral — no own financial licence).
- **We are a registered property practitioner (or operate under one).** So the product *can* act as an intermediary (offers, mandates) — but keep that behind clearly-gated, logged flows.
- **POPIA is non-negotiable.** We handle IDs, payslips, bank and property data. Privacy-by-design from commit #1 (see below).

## MVP scope (build in this order)

1. **WhatsApp webhook + message log** — receive/send via the WhatsApp Cloud API (through a BSP); persist every inbound/outbound message.
2. **Listing intake** — guided flow (WhatsApp Flows) that creates a structured listing record.
3. **Buyer enquiry + bond pre-qualification capture** — capture buyer intent and a referral hand-off payload for the originator partner.
4. **Deal record + status tracker** — model the SA transfer journey (OTP → bond → docs/FICA → clearance → lodgement → registration).
5. **Minimal web dashboard** — Next.js: view listings, deals, and a deal's status timeline.

Explicitly **out of scope for the MVP:** building our own listings portal UI from scratch (syndicate to Property24/Private Property later), our own bond origination engine, payments, native mobile apps.

## Recommended stack (don't change without asking)

- **Backend:** Node.js + TypeScript (Express or Fastify). *Python/FastAPI acceptable if a clear reason — confirm first.*
- **Database:** PostgreSQL. Use migrations from day one (e.g. Prisma or Drizzle, or node-pg-migrate).
- **Frontend:** Next.js (App Router) + React + Tailwind. Mobile-first.
- **WhatsApp:** WhatsApp Business Platform (Cloud API) via a BSP — design an adapter interface so we can swap BSP (Clickatell / 360dialog / Twilio) without touching business logic.
- **Auth/storage:** managed service (e.g. Supabase) acceptable for speed; keep it behind an interface.
- **Hosting (later):** Vercel (frontend), Railway/Render (backend + Postgres). Webhooks need a public HTTPS URL.

## Architecture principles

- **Modular monolith** to start. Clear modules: `messaging` (WhatsApp adapter), `listings`, `deals`, `buyers`/`sellers` (profiles), `finance` (originator referral hand-off), `notifications`.
- **Adapter pattern for all external services** (WhatsApp BSP, originator, conveyancer, storage) so partners can be swapped/added. No vendor SDK calls scattered through business logic.
- **The deal state machine is the heart of the app** — model the SA transfer stages explicitly; every status change is logged with a timestamp and actor.
- Typed end-to-end. Shared types between backend and frontend where practical.
- Small PRs, one feature each.

## POPIA / security rules (treat as hard requirements)

- **Never commit secrets.** Use environment variables; `.env` is gitignored; provide `.env.example` only.
- During development use **sandbox/test API keys only** — never production keys (the cloud env has no secrets vault yet).
- **Minimise PII:** only store what a step needs; document why each personal field exists.
- **Consent first:** capture explicit consent before collecting/sharing personal or financial data; record consent with a timestamp.
- **Encrypt sensitive fields at rest**; never log full ID numbers, bank details, or payslip contents.
- Every external data share (originator, conveyancer) goes through a documented, consented hand-off.
- Add a short `SECURITY.md` and keep a running list of personal data fields + purpose (POPIA data map).

## Conventions

- TypeScript strict mode. ESLint + Prettier. Conventional Commits.
- Tests for the deal state machine, the WhatsApp adapter, and any money/consent logic.
- `.env.example` stays current with every new config key.
- Keep `README.md` setup steps working — if you add a dependency or service, update it.
- South African context: currency ZAR, dates DD/MM/YYYY in UI, en-ZA. Property values are large (avg Cape Town ~R2.1m).

## Definition of done for the MVP

A seller can list a property over WhatsApp; a buyer can enquire and be captured as a (optionally pre-qualified) referral to the originator partner; a deal record tracks the transaction through the SA transfer stages; and an internal user can see all of this in the web dashboard. All without storing a single production secret in the repo.
