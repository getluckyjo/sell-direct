# Supabase — managed backend

Sold Direct uses **Supabase** as its managed backend for three things:

1. **Postgres** — the production database (Prisma connects to it via `DATABASE_URL` / `DIRECT_URL`).
2. **Auth** — the dashboard sign-in (wired at PR 6, behind the `AuthProvider` interface in `apps/api/src/modules/auth`).
3. **Storage** — listing photos and, later, FICA documents (wired when uploads land, behind the `StorageProvider` interface in `apps/api/src/modules/storage`).

Everything sits **behind interfaces**, so Supabase can be swapped without touching business logic.

> **Local dev and CI do _not_ use Supabase.** They run a throwaway Postgres
> (`postgres:16`) and point both DB URLs at it. Supabase is the **deploy** target.

## Why two database URLs?

Supabase offers a **pooled** connection (pgBouncer, port `6543`) and a **direct**
connection (port `5432`). Prisma needs both:

| Var            | Connection            | Used for                          |
| -------------- | --------------------- | --------------------------------- |
| `DATABASE_URL` | pooled (`6543`)       | app runtime queries               |
| `DIRECT_URL`   | direct (`5432`)       | `prisma migrate` (DDL, advisory locks) |

The Prisma datasource (`apps/api/prisma/schema.prisma`) wires `url` →
`DATABASE_URL` and `directUrl` → `DIRECT_URL`. Locally both point at the same
plain Postgres.

## One-time setup (deploy)

1. Create a project at [supabase.com](https://supabase.com) (region close to Cape Town, e.g. `eu-west`).
2. **Project Settings → Database → Connection string**: copy the **pooled** (Transaction, `6543`) and **direct** (`5432`) strings.
   - `DATABASE_URL` = pooled string + `?pgbouncer=true`
   - `DIRECT_URL` = direct string
3. **Project Settings → API**: copy `Project URL`, the `anon` public key, and the `service_role` key.
   - `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (server only — **never** expose to the browser)
   - `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (web)
4. Set all of these in the **host's environment settings** (Vercel / Railway) — **never** commit them. See `.env.example` for the full list.
5. Run migrations against Supabase once: `DATABASE_URL`/`DIRECT_URL` set → `pnpm db:deploy` (`prisma migrate deploy`).

## POPIA

Supabase is a data processor for us — a **Data Processing Agreement** is required
before storing any personal data there. Enable encryption/RLS as appropriate and
keep the `service_role` key server-side only. See `docs/POPIA-data-map.md` and
`SECURITY.md`.
